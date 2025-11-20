# Schema Infrastructure

This directory contains a comprehensive schema system for JSON data validation, type inference, and structure definition.

## Overview

The schema infrastructure provides:

- **Type Definitions**: Complete TypeScript types for schema nodes and validation
- **Schema Inference**: Automatic schema generation from sample JSON data
- **Validation**: Comprehensive validation of data against schemas with detailed error reporting
- **Format Detection**: Automatic detection of string formats (email, URL, date, UUID, etc.)

## Files

### Core Implementation

- **`types.ts`** (5.2 KB): TypeScript type definitions for the schema system
- **`inference.ts`** (9.0 KB): Schema inference from JSON data
- **`validator.ts`** (12 KB): Validation engine with detailed error reporting
- **`index.ts`** (1.6 KB): Barrel exports for the module

### Testing and Examples

- **`inference.test.ts`** (6.5 KB): 12 comprehensive tests for schema inference
- **`validator.test.ts`** (6.3 KB): 17 comprehensive tests for validation
- **`example-usage.ts`** (7.4 KB): 10 detailed usage examples
- **`README.md`**: This file

## Quick Start

```typescript
import { inferSchema, validate } from './schema';

// Infer schema from data
const data = { name: "John", age: 30, email: "john@example.com" };
const schema = inferSchema(data, { inferFormats: true });

// Validate new data
const result = validate({ name: "Jane", age: 25, email: "jane@example.com" }, schema);
if (!result.valid) {
  console.error(result.errors);
}
```

## Supported JSON Types

- **Primitives**: `string`, `number`, `boolean`, `null`
- **Complex**: `object`, `array`

## Schema Features

### Type System

- Full TypeScript type safety
- Nested object schemas
- Array item schemas
- Nullable types

### String Validation

- `minLength` / `maxLength`: String length constraints
- `pattern`: Regular expression validation
- `enum`: Allowed values
- `format`: Automatic format detection and validation
  - `email`: Email addresses
  - `uri`/`url`: URLs
  - `date`: ISO 8601 dates (YYYY-MM-DD)
  - `date-time`: ISO 8601 date-times
  - `time`: Time values (HH:MM:SS)
  - `uuid`: UUID v4
  - `ipv4`/`ipv6`: IP addresses

### Number Validation

- `minimum` / `maximum`: Range constraints
- `multipleOf`: Multiple validation
- `enum`: Allowed values

### Object Validation

- `properties`: Property schemas
- `required`: Required property names
- `additionalProperties`: Schema for extra properties
- `minProperties` / `maxProperties`: Property count constraints

### Array Validation

- `items`: Schema for array items
- `minItems` / `maxItems`: Length constraints
- `uniqueItems`: Uniqueness validation

## Schema Inference Options

```typescript
interface InferenceOptions {
  strictRequired?: boolean;      // Mark all properties as required (default: true)
  inferFormats?: boolean;         // Detect string formats (default: true)
  includeExamples?: boolean;      // Include sample values (default: false)
  maxExamples?: number;           // Max examples per node (default: 3)
  inferEnums?: boolean;           // Infer enums from repeated values (default: false)
  enumThreshold?: number;         // Min occurrences for enum (default: 3)
}
```

## Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string[];        // JSONPath to the error
  message: string;       // Human-readable error message
  expected?: string;     // Expected type/value
  actual?: string;       // Actual type/value
  rule?: string;         // Validation rule that failed
}
```

## Usage Examples

### 1. Basic Inference and Validation

```typescript
const schema = inferSchema({ name: "John", age: 30 });
const result = validate({ name: "Jane", age: 25 }, schema);
```

### 2. Multiple Samples

```typescript
const samples = [
  { name: "John", age: 30, city: "NYC" },
  { name: "Jane", age: 25, country: "USA" }
];
const schema = inferSchemaFromSamples(samples);
// Schema includes all properties: name, age, city, country
// Only name and age are required (present in all samples)
```

### 3. Format Detection

```typescript
const data = {
  email: "test@example.com",
  website: "https://example.com",
  date: "2024-01-15"
};
const schema = inferSchema(data, { inferFormats: true });
```

### 4. Custom Constraints

```typescript
const passwordSchema: Schema = {
  root: {
    type: 'string',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'
  }
};
```

### 5. Quick Type Checking

```typescript
import { matches, matchesType } from './schema';

// Full validation (including constraints)
matches(value, schemaNode);

// Type-only validation (no constraints)
matchesType(value, schemaNode);
```

## Design Decisions

### Lightweight Implementation

- Focuses on core JSON Schema concepts
- Doesn't implement the full JSON Schema specification
- Optimized for common use cases

### Type Safety

- Strong TypeScript typing throughout
- Discriminated union types for schema nodes
- Type guards for safe type narrowing

### Error Reporting

- Detailed error messages with paths
- Includes expected vs actual values
- Identifies the specific validation rule that failed

### Format Detection

- Regex-based format detection
- Common formats supported out of the box
- Extensible for custom formats

## Future Enhancements

Potential future additions:

1. **JSON Schema Import/Export**: Convert to/from standard JSON Schema
2. **Schema Merging**: Combine multiple schemas
3. **Schema Diffing**: Compare schemas and detect changes
4. **Advanced Constraints**: More complex validation rules
5. **Custom Format Validators**: User-defined format validators
6. **Async Validation**: Support for async validators

## Testing

Run tests:

```bash
bun run test src/components/json-viewer/schema/
```

All 29 tests passing:
- 12 inference tests
- 17 validation tests

## Integration

The schema infrastructure integrates with the JSON viewer to enable:

1. **Type Detection**: Automatically detect types in JSON data
2. **Validation**: Validate data before editing
3. **Editing Support**: Type-aware editing with validation
4. **Documentation**: Generate documentation from schemas
5. **Error Highlighting**: Show validation errors in the UI

## License

Part of the json-viewer project.
