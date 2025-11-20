/**
 * Zod-based validation system with confidence scoring
 *
 * This module provides robust validation using Zod schemas and libphonenumber-js,
 * with confidence-based detection that returns an array of possible formats with scores.
 */

import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';
import type {
  FormatDetectionResult,
  ValidationCheckResult,
  ValidationFormat,
} from './types';

// ============================================================================
// Zod Schema Definitions
// ============================================================================

/**
 * Email validator using Zod's built-in email validation
 */
const emailSchema = z.string().email();

/**
 * URL validator using Zod's built-in URL validation
 */
const urlSchema = z.string().url();

/**
 * UUID validator (supports all UUID versions)
 */
const uuidSchema = z.string().uuid();

/**
 * IPv4 address validator
 */
const ipv4Schema = z.string().ip({ version: 'v4' });

/**
 * IPv6 address validator
 */
const ipv6Schema = z.string().ip({ version: 'v6' });

/**
 * Date validator (YYYY-MM-DD format)
 */
const dateSchema = z.string().date();

/**
 * Date-time validator (ISO 8601 format)
 */
const dateTimeSchema = z.string().datetime({ offset: true });

/**
 * Time validator (HH:MM:SS format)
 */
const timeSchema = z.string().time({ precision: 3 });

/**
 * Base64 validator
 */
const base64Schema = z
  .string()
  .regex(
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    'Invalid base64',
  );

/**
 * Hex color validator (supports #RGB, #RRGGBB, #RRGGBBAA)
 */
const hexColorSchema = z
  .string()
  .regex(
    /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/,
    'Invalid hex color',
  );

/**
 * JWT token validator (basic format check)
 */
const jwtSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    'Invalid JWT format',
  );

/**
 * MAC address validator (supports various formats)
 */
const macAddressSchema = z
  .string()
  .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address');

/**
 * Hostname validator
 */
const hostnameSchema = z
  .string()
  .regex(
    /^(?=.{1,253}$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/,
    'Invalid hostname',
  );

/**
 * Domain name validator
 */
const domainSchema = z
  .string()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    'Invalid domain',
  );

/**
 * Credit card validator (basic Luhn algorithm)
 */
const creditCardSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },
  { message: 'Invalid credit card number' },
);

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates an email address
 */
export function validateEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

/**
 * Validates a URL
 */
export function validateUrl(value: string): boolean {
  return urlSchema.safeParse(value).success;
}

/**
 * Validates a UUID
 */
export function validateUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}

/**
 * Validates an IPv4 address
 */
export function validateIpv4(value: string): boolean {
  return ipv4Schema.safeParse(value).success;
}

/**
 * Validates an IPv6 address
 */
export function validateIpv6(value: string): boolean {
  return ipv6Schema.safeParse(value).success;
}

/**
 * Validates a phone number using libphonenumber-js
 */
export function validatePhone(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

/**
 * Validates a date (YYYY-MM-DD format)
 */
export function validateDate(value: string): boolean {
  return dateSchema.safeParse(value).success;
}

/**
 * Validates a date-time (ISO 8601 format)
 */
export function validateDateTime(value: string): boolean {
  return dateTimeSchema.safeParse(value).success;
}

/**
 * Validates a time (HH:MM:SS format)
 */
export function validateTime(value: string): boolean {
  return timeSchema.safeParse(value).success;
}

/**
 * Validates a credit card number using Luhn algorithm
 */
export function validateCreditCard(value: string): boolean {
  return creditCardSchema.safeParse(value).success;
}

/**
 * Validates a base64 encoded string
 */
export function validateBase64(value: string): boolean {
  return base64Schema.safeParse(value).success;
}

/**
 * Validates a hex color code
 */
export function validateHexColor(value: string): boolean {
  return hexColorSchema.safeParse(value).success;
}

/**
 * Validates a JWT token
 */
export function validateJwt(value: string): boolean {
  return jwtSchema.safeParse(value).success;
}

/**
 * Validates a MAC address
 */
export function validateMacAddress(value: string): boolean {
  return macAddressSchema.safeParse(value).success;
}

/**
 * Validates a hostname
 */
export function validateHostname(value: string): boolean {
  return hostnameSchema.safeParse(value).success;
}

/**
 * Validates a domain name
 */
export function validateDomain(value: string): boolean {
  return domainSchema.safeParse(value).success;
}

// ============================================================================
// Advanced Validation with Confidence Scoring
// ============================================================================

/**
 * Validates email with confidence scoring
 */
function validateEmailWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = emailSchema.safeParse(value);

  if (result.success) {
    // High confidence for valid emails
    const hasCommonTLD = /\.(com|org|net|edu|gov|io|co|dev)$/i.test(value);
    return {
      format: 'email',
      confidence: hasCommonTLD ? 1.0 : 0.9,
      isValid: true,
    };
  }

  // Check for partial email patterns (low confidence)
  if (/@/.test(value) && value.includes('.')) {
    return {
      format: 'email',
      confidence: 0.3,
      isValid: false,
      reason: 'Contains @ and . but fails strict email validation',
    };
  }

  return null;
}

/**
 * Validates URL with confidence scoring
 */
function validateUrlWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = urlSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'uri',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for URL-like patterns
  if (
    /^(https?|ftp|file):\/\//i.test(value) ||
    /^www\./i.test(value) ||
    /\.(com|org|net|edu|gov|io|co|dev)(\/|$)/i.test(value)
  ) {
    return {
      format: 'uri',
      confidence: 0.5,
      isValid: false,
      reason: 'URL-like pattern but fails strict validation',
    };
  }

  return null;
}

/**
 * Validates UUID with confidence scoring
 */
function validateUuidWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = uuidSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'uuid',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for UUID-like pattern (with hyphens in right places but wrong format)
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return {
      format: 'uuid',
      confidence: 0.8,
      isValid: false,
      reason: 'UUID-like pattern but fails strict validation',
    };
  }

  return null;
}

/**
 * Validates IPv4 with confidence scoring
 */
function validateIpv4WithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = ipv4Schema.safeParse(value);

  if (result.success) {
    return {
      format: 'ipv4',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for IPv4-like pattern (but invalid ranges)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return {
      format: 'ipv4',
      confidence: 0.4,
      isValid: false,
      reason: 'IPv4-like pattern but octets out of valid range (0-255)',
    };
  }

  return null;
}

/**
 * Validates IPv6 with confidence scoring
 */
function validateIpv6WithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = ipv6Schema.safeParse(value);

  if (result.success) {
    return {
      format: 'ipv6',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for IPv6-like pattern
  if (/^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(value)) {
    return {
      format: 'ipv6',
      confidence: 0.5,
      isValid: false,
      reason: 'IPv6-like pattern but fails strict validation',
    };
  }

  return null;
}

/**
 * Validates phone number with confidence scoring using libphonenumber-js
 */
function validatePhoneWithConfidence(
  value: string,
): FormatDetectionResult | null {
  try {
    if (isValidPhoneNumber(value)) {
      const phoneNumber = parsePhoneNumber(value);
      return {
        format: 'phone',
        confidence: 1.0,
        isValid: true,
        metadata: {
          country: phoneNumber.country,
          nationalNumber: phoneNumber.nationalNumber,
          formatInternational: phoneNumber.formatInternational(),
          formatNational: phoneNumber.formatNational(),
          type: phoneNumber.getType(),
        },
      };
    }

    // Check for phone-like patterns
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return {
        format: 'phone',
        confidence: 0.4,
        isValid: false,
        reason: 'Has phone-like digit count but fails validation',
      };
    }
  } catch {
    // libphonenumber-js threw an error
  }

  // Very basic phone pattern check
  if (/^[\d\s()+-]{10,}$/.test(value)) {
    return {
      format: 'phone',
      confidence: 0.2,
      isValid: false,
      reason: 'Contains phone-like characters but fails validation',
    };
  }

  return null;
}

/**
 * Validates date with confidence scoring
 */
function validateDateWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = dateSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'date',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for date-like patterns
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      format: 'date',
      confidence: 0.6,
      isValid: false,
      reason: 'Date-like pattern but invalid date values',
    };
  }

  return null;
}

/**
 * Validates date-time with confidence scoring
 */
function validateDateTimeWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = dateTimeSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'date-time',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for ISO 8601-like patterns
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return {
      format: 'date-time',
      confidence: 0.7,
      isValid: false,
      reason: 'ISO 8601-like pattern but fails strict validation',
    };
  }

  return null;
}

/**
 * Validates time with confidence scoring
 */
function validateTimeWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = timeSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'time',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for time-like patterns
  if (/^\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(value)) {
    return {
      format: 'time',
      confidence: 0.6,
      isValid: false,
      reason: 'Time-like pattern but invalid time values',
    };
  }

  return null;
}

/**
 * Validates credit card with confidence scoring
 */
function validateCreditCardWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = creditCardSchema.safeParse(value);

  if (result.success) {
    const digits = value.replace(/\D/g, '');
    return {
      format: 'credit-card',
      confidence: 1.0,
      isValid: true,
      metadata: {
        length: digits.length,
      },
    };
  }

  // Check for credit card-like patterns
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 13 && digits.length <= 19) {
    return {
      format: 'credit-card',
      confidence: 0.3,
      isValid: false,
      reason: 'Has credit card-like length but fails Luhn check',
    };
  }

  return null;
}

/**
 * Validates base64 with confidence scoring
 */
function validateBase64WithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = base64Schema.safeParse(value);

  if (result.success) {
    return {
      format: 'base64',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for base64-like patterns (but incorrect padding)
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0) {
    return {
      format: 'base64',
      confidence: 0.6,
      isValid: false,
      reason: 'Base64-like pattern but fails validation',
    };
  }

  return null;
}

/**
 * Validates hex color with confidence scoring
 */
function validateHexColorWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = hexColorSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'hex-color',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for hex color-like patterns
  if (/^#[A-Fa-f0-9]+$/.test(value)) {
    return {
      format: 'hex-color',
      confidence: 0.4,
      isValid: false,
      reason: 'Hex-like pattern but wrong length (should be 3, 6, or 8 digits)',
    };
  }

  return null;
}

/**
 * Validates JWT with confidence scoring
 */
function validateJwtWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = jwtSchema.safeParse(value);

  if (result.success) {
    const parts = value.split('.');
    return {
      format: 'jwt',
      confidence: 1.0,
      isValid: true,
      metadata: {
        parts: parts.length,
      },
    };
  }

  // Check for JWT-like patterns (3 parts separated by dots)
  if (value.split('.').length === 3) {
    return {
      format: 'jwt',
      confidence: 0.5,
      isValid: false,
      reason: 'Has JWT-like structure but fails validation',
    };
  }

  return null;
}

/**
 * Validates MAC address with confidence scoring
 */
function validateMacAddressWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = macAddressSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'mac-address',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for MAC-like patterns (different separators or wrong format)
  if (/^([0-9A-Fa-f]{2}[.:-]?){5}[0-9A-Fa-f]{2}$/.test(value)) {
    return {
      format: 'mac-address',
      confidence: 0.6,
      isValid: false,
      reason: 'MAC-like pattern but uses non-standard separator',
    };
  }

  return null;
}

/**
 * Validates hostname with confidence scoring
 */
function validateHostnameWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = hostnameSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'hostname',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for hostname-like patterns
  if (/^[a-z0-9.-]+$/i.test(value) && value.includes('.')) {
    return {
      format: 'hostname',
      confidence: 0.5,
      isValid: false,
      reason: 'Hostname-like pattern but fails strict validation',
    };
  }

  return null;
}

/**
 * Validates domain with confidence scoring
 */
function validateDomainWithConfidence(
  value: string,
): FormatDetectionResult | null {
  const result = domainSchema.safeParse(value);

  if (result.success) {
    return {
      format: 'domain',
      confidence: 1.0,
      isValid: true,
    };
  }

  // Check for domain-like patterns
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
    return {
      format: 'domain',
      confidence: 0.5,
      isValid: false,
      reason: 'Domain-like pattern but fails strict validation',
    };
  }

  return null;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detects format with confidence scoring
 *
 * Returns an array of possible formats with confidence scores, sorted by confidence (highest first).
 * This allows consumers to choose the most likely format or handle multiple possibilities.
 *
 * @param value - The string value to analyze
 * @param minConfidence - Minimum confidence threshold (default: 0.1)
 * @returns Array of detection results sorted by confidence (descending)
 *
 * @example
 * const results = detectFormatWithConfidence('user@example.com');
 * // Returns: [{ format: 'email', confidence: 1.0, isValid: true }]
 *
 * @example
 * const results = detectFormatWithConfidence('192.168.1.999');
 * // Returns: [{ format: 'ipv4', confidence: 0.4, isValid: false, reason: '...' }]
 */
export function detectFormatWithConfidence(
  value: string,
  minConfidence = 0.1,
): FormatDetectionResult[] {
  if (!value || typeof value !== 'string') {
    return [];
  }

  const results: FormatDetectionResult[] = [];

  // Run all validators
  const detectors: Array<(val: string) => FormatDetectionResult | null> = [
    validateDateTimeWithConfidence, // Check datetime before date (more specific)
    validateDateWithConfidence,
    validateTimeWithConfidence,
    validateEmailWithConfidence,
    validateUrlWithConfidence,
    validateUuidWithConfidence,
    validatePhoneWithConfidence,
    validateIpv4WithConfidence,
    validateIpv6WithConfidence,
    validateCreditCardWithConfidence,
    validateBase64WithConfidence,
    validateHexColorWithConfidence,
    validateJwtWithConfidence,
    validateMacAddressWithConfidence,
    validateHostnameWithConfidence,
    validateDomainWithConfidence,
  ];

  for (const detector of detectors) {
    const result = detector(value);
    if (result && result.confidence >= minConfidence) {
      results.push(result);
    }
  }

  // Sort by confidence (highest first), then by isValid
  return results.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 0.01) {
      return a.isValid === b.isValid ? 0 : a.isValid ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });
}

/**
 * Detects the most likely format (highest confidence)
 *
 * @param value - The string value to analyze
 * @param minConfidence - Minimum confidence threshold (default: 0.5)
 * @returns The most likely format detection result, or null if none found
 *
 * @example
 * const result = detectFormat('user@example.com');
 * // Returns: { format: 'email', confidence: 1.0, isValid: true }
 */
export function detectFormat(
  value: string,
  minConfidence = 0.5,
): FormatDetectionResult | null {
  const results = detectFormatWithConfidence(value, minConfidence);
  return results.length > 0 ? results[0] : null;
}

/**
 * Validates a value against a specific format
 *
 * @param value - The string value to validate
 * @param format - The format to validate against
 * @returns Validation result with metadata
 *
 * @example
 * const result = validateFormat('user@example.com', 'email');
 * // Returns: { valid: true }
 */
export function validateFormat(
  value: string,
  format: ValidationFormat,
): ValidationCheckResult {
  const validators: Record<
    ValidationFormat,
    (val: string) => FormatDetectionResult | null
  > = {
    email: validateEmailWithConfidence,
    uri: validateUrlWithConfidence,
    url: validateUrlWithConfidence,
    uuid: validateUuidWithConfidence,
    ipv4: validateIpv4WithConfidence,
    ipv6: validateIpv6WithConfidence,
    phone: validatePhoneWithConfidence,
    date: validateDateWithConfidence,
    'date-time': validateDateTimeWithConfidence,
    time: validateTimeWithConfidence,
    'credit-card': validateCreditCardWithConfidence,
    base64: validateBase64WithConfidence,
    'hex-color': validateHexColorWithConfidence,
    jwt: validateJwtWithConfidence,
    'mac-address': validateMacAddressWithConfidence,
    hostname: validateHostnameWithConfidence,
    domain: validateDomainWithConfidence,
  };

  const validator = validators[format];
  if (!validator) {
    return {
      valid: false,
      error: `Unknown format: ${format}`,
    };
  }

  const result = validator(value);
  if (!result) {
    return {
      valid: false,
      error: `Value does not match format: ${format}`,
    };
  }

  return {
    valid: result.isValid,
    error: result.isValid ? undefined : result.reason,
    metadata: result.metadata,
  };
}
