/**
 * Validation module exports
 *
 * This module provides comprehensive validation using Zod schemas and libphonenumber-js,
 * with confidence-based detection for format inference.
 */

export type {
  FormatDetectionResult,
  ValidationCheckResult,
  ValidationFormat,
} from './types';

export {
  detectFormat,
  detectFormatWithConfidence,
  validateBase64,
  validateCreditCard,
  validateDate,
  validateDateTime,
  validateDomain,
  validateEmail,
  validateFormat,
  validateHexColor,
  validateHostname,
  validateIpv4,
  validateIpv6,
  validateJwt,
  validateMacAddress,
  validatePhone,
  validateTime,
  validateUrl,
  validateUuid,
} from './validators';
