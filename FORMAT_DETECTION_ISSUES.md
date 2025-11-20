# Format Detection Issues and Proposed Solutions

## Current Implementation Problems

### 1. **Email Detection (Line 109-111)**
```typescript
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
  return 'email';
}
```

**Problems:**
- ✗ Matches Git SSH addresses: `git@github.com:user/repo.git`
- ✗ Too permissive - allows invalid emails like `test@domain@com`
- ✗ Doesn't validate TLD or local-part properly
- ✗ Allows spaces in non-whitespace characters

**Examples of False Positives:**
- `git@github.com:user/repo.git` → Detected as email (wrong!)
- `admin@server@domain.com` → Detected as email (invalid!)
- `user@domain` → Detected as email (missing TLD!)

---

### 2. **IPv4 Detection (Line 128-134)**
```typescript
if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
  const octets = value.split('.').map(Number);
  if (octets.every((octet) => octet >= 0 && octet <= 255)) {
    return 'ipv4';
  }
}
```

**Problems:**
- ✓ Good: Validates octets are 0-255
- ✗ Ambiguous: Values like `192.168.1.1` could be IPs or version numbers
- ✗ Falls through to phone detection if invalid

**Example:**
- `999.999.999.999` → Fails IPv4 check, then gets checked as phone number

---

### 3. **Phone Detection (Line 143-153)**
```typescript
if (
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(value)
) {
  const digitCount = value.replace(/\D/g, '').length;
  if (digitCount >= 10 && digitCount <= 15) {
    return 'phone';
  }
}
```

**Problems:**
- ✗ **VERY permissive** - matches almost any numeric pattern with dots/dashes
- ✗ Catches invalid IP addresses (e.g., `999.999.999.999` has 12 digits → phone!)
- ✗ Matches semantic version numbers (e.g., `10.0.1.2345` → phone!)
- ✗ No validation of actual phone number structure

**Examples of False Positives:**
- `192.168.001.1` → 12 digits → Detected as phone (wrong!)
- `999.999.999.999` → 12 digits → Detected as phone (wrong!)
- `10.0.1.2345` → 10 digits → Detected as phone (wrong!)
- `1234-5678-9012` → 12 digits → Detected as phone (maybe valid, but ambiguous!)

---

### 4. **URL Detection (Line 114-116)**
```typescript
if (/^https?:\/\/.+/.test(value)) {
  return 'url';
}
```

**Problems:**
- ✗ Too simple - doesn't validate domain structure
- ✗ Allows invalid URLs like `http://` or `https://-invalid`
- ✗ Doesn't support other protocols (ftp, ws, etc.)

---

## Root Cause Analysis

The fundamental issues are:

1. **Regex-based detection is order-dependent** - Patterns checked later (phone) catch misses from earlier patterns (IPv4)
2. **Patterns are too permissive** - Trying to catch all valid cases leads to false positives
3. **No contextual validation** - No way to distinguish between `192.168.1.1` (IP) vs `10.0.1.2345` (version)
4. **Ambiguity resolution is impossible** - Without context, some strings are legitimately ambiguous

---

## Proposed Solution: Multi-Layered Validation Architecture

### Layer 1: Battle-Tested Libraries (Zod)

Replace regex patterns with Zod schemas for robust validation:

```typescript
import { z } from 'zod';

// Define validation schemas
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();
const ipv4Schema = z.string().ip({ version: 'v4' });
const ipv6Schema = z.string().ip({ version: 'v6' });

// Phone validation with libphonenumber-js (battle-tested)
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

function validatePhone(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}
```

### Layer 2: JSONPath-Based Type Mapping

Allow users to explicitly specify types for specific paths:

```typescript
interface FormatMapping {
  jsonPath: string | RegExp;
  format: ValidationFormat;
  priority?: number; // Higher priority overrides auto-detection
}

const formatMappings: FormatMapping[] = [
  { jsonPath: '$.user.email', format: 'email', priority: 100 },
  { jsonPath: '$.server.ip', format: 'ipv4', priority: 100 },
  { jsonPath: /\.phoneNumber$/, format: 'phone', priority: 100 },
  { jsonPath: /\.repository$/, format: 'git-ssh', priority: 100 }, // Custom format
];

<JsonViewer
  json={data}
  formatMappings={formatMappings}
  enableValidation={true}
/>
```

### Layer 3: Confidence-Based Detection

Return confidence scores instead of binary matches:

```typescript
interface FormatDetectionResult {
  format: ValidationFormat;
  confidence: number; // 0.0 to 1.0
  isValid: boolean;
  reason?: string;
}

function detectFormatWithConfidence(value: string): FormatDetectionResult[] {
  const results: FormatDetectionResult[] = [];

  // Try each format with validation
  try {
    emailSchema.parse(value);
    results.push({ format: 'email', confidence: 0.95, isValid: true });
  } catch {}

  try {
    ipv4Schema.parse(value);
    const hasPortOrPath = /:|\\//.test(value);
    results.push({
      format: 'ipv4',
      confidence: hasPortOrPath ? 0.6 : 0.9, // Lower if has port/path
      isValid: true
    });
  } catch {}

  if (validatePhone(value)) {
    const hasLetters = /[a-zA-Z]/.test(value);
    results.push({
      format: 'phone',
      confidence: hasLetters ? 0.3 : 0.85, // Lower if has letters
      isValid: true
    });
  }

  // Return sorted by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}
```

---

## Implementation Plan

### Phase 1: Add Dependencies
```bash
bun add zod libphonenumber-js
```

### Phase 2: Create Validation Service
Create `/src/components/json-viewer/validation/validators.ts`:
- Wrap Zod validators
- Add libphonenumber-js integration
- Implement confidence-based detection

### Phase 3: Add Format Mapping System
Create `/src/components/json-viewer/validation/format-mapping.ts`:
- JSONPath matcher utility
- Priority-based format resolution
- API for user-defined mappings

### Phase 4: Update Renderers
- Replace `detectFormat()` with `detectFormatWithConfidence()`
- Check format mappings first (highest priority)
- Fall back to confidence-based detection
- Show confidence indicator in UI (e.g., "Email (95% confidence)")

### Phase 5: Update Schema System
- Replace regex patterns in `inference.ts` with Zod validators
- Add format mapping support to schema definition

---

## Benefits

1. **Accuracy**: Battle-tested libraries handle edge cases correctly
2. **Flexibility**: Users can override auto-detection with explicit mappings
3. **Transparency**: Confidence scores show uncertainty to users
4. **Maintainability**: Less custom regex code to maintain
5. **Extensibility**: Easy to add new formats with custom validators

---

## Example Usage

```typescript
import { JsonViewer } from '@umstek/json-viewer';

const formatMappings = [
  // Explicit: server IPs should always be IPv4
  { jsonPath: '$.servers[*].ip', format: 'ipv4', priority: 100 },

  // Explicit: contact fields are emails, not Git SSH
  { jsonPath: /\.email$/, format: 'email', priority: 100 },

  // Explicit: phone numbers in contact info
  { jsonPath: '$.contacts[*].phone', format: 'phone', priority: 100 },

  // Custom format for Git repositories
  {
    jsonPath: /\.(repository|repo)$/,
    format: 'git-ssh',
    priority: 100,
    validator: (value) => /^git@[\w.-]+:[\w/-]+\.git$/.test(value)
  },
];

<JsonViewer
  json={jsonString}
  formatMappings={formatMappings}
  enableValidation={true}
  validationOptions={{
    showConfidence: true, // Show confidence scores
    minConfidence: 0.7,   // Only show if confidence >= 70%
  }}
/>
```

---

## Migration Path

1. Keep existing regex-based detection as fallback
2. Add Zod-based validation as primary layer
3. Add format mapping system as override layer
4. Gradually deprecate regex patterns
5. Eventually remove regex-based detection in v2.0

This way, existing users aren't broken, but new users get better validation.
