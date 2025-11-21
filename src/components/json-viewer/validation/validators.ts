/**
 * Zod-based validation system
 *
 * This module provides robust validation using Zod schemas and libphonenumber-js.
 * Simplified to just validate - no confidence scoring.
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

const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();
const ipv4Schema = z.string().ip({ version: 'v4' });
const ipv6Schema = z.string().ip({ version: 'v6' });
const dateSchema = z.string().date();
const dateTimeSchema = z.string().datetime({ offset: true });
const timeSchema = z.string().time({ precision: 3 });
const base64Schema = z
  .string()
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/);
const jwtSchema = z
  .string()
  .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/);
const macAddressSchema = z
  .string()
  .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
const hostnameSchema = z
  .string()
  .regex(
    /^(?=.{1,253}$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/,
  );
const domainSchema = z
  .string()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
  );
const creditCardSchema = z.string().refine((val) => {
  const digits = val.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
});

// ============================================================================
// Simple Validation Functions
// ============================================================================

export function validateEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export function validateUrl(value: string): boolean {
  return urlSchema.safeParse(value).success;
}

export function validateUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}

export function validateIpv4(value: string): boolean {
  return ipv4Schema.safeParse(value).success;
}

export function validateIpv6(value: string): boolean {
  return ipv6Schema.safeParse(value).success;
}

export function validatePhone(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

export function validateDate(value: string): boolean {
  return dateSchema.safeParse(value).success;
}

export function validateDateTime(value: string): boolean {
  return dateTimeSchema.safeParse(value).success;
}

export function validateTime(value: string): boolean {
  return timeSchema.safeParse(value).success;
}

export function validateCreditCard(value: string): boolean {
  return creditCardSchema.safeParse(value).success;
}

export function validateBase64(value: string): boolean {
  return base64Schema.safeParse(value).success;
}

export function validateHexColor(value: string): boolean {
  return hexColorSchema.safeParse(value).success;
}

export function validateJwt(value: string): boolean {
  return jwtSchema.safeParse(value).success;
}

export function validateMacAddress(value: string): boolean {
  return macAddressSchema.safeParse(value).success;
}

export function validateHostname(value: string): boolean {
  return hostnameSchema.safeParse(value).success;
}

export function validateDomain(value: string): boolean {
  return domainSchema.safeParse(value).success;
}

// ============================================================================
// Format Detection
// ============================================================================

type Validator = (value: string) => boolean;

const formatValidators: [ValidationFormat, Validator][] = [
  ['date-time', validateDateTime], // Check datetime before date (more specific)
  ['date', validateDate],
  ['time', validateTime],
  ['email', validateEmail],
  ['uri', validateUrl],
  ['uuid', validateUuid],
  ['ipv4', validateIpv4],
  ['ipv6', validateIpv6],
  ['phone', validatePhone],
  ['credit-card', validateCreditCard],
  ['hex-color', validateHexColor],
  ['jwt', validateJwt],
  ['mac-address', validateMacAddress],
  ['base64', validateBase64],
  ['hostname', validateHostname],
  ['domain', validateDomain],
];

/**
 * Detects the format of a string value
 * Returns the first matching format, or null if none match
 */
export function detectFormat(
  value: string,
  _minConfidence?: number, // kept for API compatibility, ignored
): FormatDetectionResult | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  for (const [format, validator] of formatValidators) {
    if (validator(value)) {
      return { format, confidence: 1.0, isValid: true };
    }
  }

  return null;
}

/**
 * Detects all matching formats
 */
export function detectFormatWithConfidence(
  value: string,
  _minConfidence?: number,
): FormatDetectionResult[] {
  if (!value || typeof value !== 'string') {
    return [];
  }

  const results: FormatDetectionResult[] = [];
  for (const [format, validator] of formatValidators) {
    if (validator(value)) {
      results.push({ format, confidence: 1.0, isValid: true });
    }
  }
  return results;
}

/**
 * Validates a value against a specific format
 */
export function validateFormat(
  value: string,
  format: ValidationFormat,
): ValidationCheckResult {
  const validatorMap: Record<ValidationFormat, Validator> = {
    email: validateEmail,
    uri: validateUrl,
    url: validateUrl,
    uuid: validateUuid,
    ipv4: validateIpv4,
    ipv6: validateIpv6,
    phone: validatePhone,
    date: validateDate,
    'date-time': validateDateTime,
    time: validateTime,
    'credit-card': validateCreditCard,
    base64: validateBase64,
    'hex-color': validateHexColor,
    jwt: validateJwt,
    'mac-address': validateMacAddress,
    hostname: validateHostname,
    domain: validateDomain,
  };

  const validator = validatorMap[format];
  if (!validator) {
    return { valid: false, error: `Unknown format: ${format}` };
  }

  const isValid = validator(value);
  return {
    valid: isValid,
    error: isValid ? undefined : `Value does not match format: ${format}`,
  };
}

/**
 * Get phone number metadata (for display purposes)
 */
export function getPhoneMetadata(
  value: string,
): Record<string, unknown> | null {
  try {
    if (isValidPhoneNumber(value)) {
      const phoneNumber = parsePhoneNumber(value);
      return {
        country: phoneNumber.country,
        nationalNumber: phoneNumber.nationalNumber,
        formatInternational: phoneNumber.formatInternational(),
        formatNational: phoneNumber.formatNational(),
        type: phoneNumber.getType(),
      };
    }
  } catch {
    // ignore
  }
  return null;
}
