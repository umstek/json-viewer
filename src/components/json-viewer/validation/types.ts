/**
 * Validation types and interfaces
 *
 * This module defines types for format detection and validation with confidence scoring.
 */

/**
 * Supported validation formats
 */
export type ValidationFormat =
  | 'email'
  | 'uri'
  | 'url'
  | 'uuid'
  | 'ipv4'
  | 'ipv6'
  | 'phone'
  | 'date'
  | 'date-time'
  | 'time'
  | 'credit-card'
  | 'base64'
  | 'hex-color'
  | 'jwt'
  | 'mac-address'
  | 'hostname'
  | 'domain';

/**
 * Result of format detection with confidence scoring
 */
export interface FormatDetectionResult {
  /**
   * The detected format type
   */
  format: ValidationFormat;

  /**
   * Confidence score from 0.0 to 1.0
   * - 1.0: Definite match (passed strict validation)
   * - 0.7-0.9: High confidence (passed relaxed validation or pattern match)
   * - 0.4-0.6: Medium confidence (partial match)
   * - 0.1-0.3: Low confidence (weak pattern match)
   */
  confidence: number;

  /**
   * Whether the value is valid according to strict validation rules
   */
  isValid: boolean;

  /**
   * Optional reason for the detection or validation failure
   */
  reason?: string;

  /**
   * Additional metadata about the detection
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a single validation check
 */
export interface ValidationCheckResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;

  /**
   * Optional error message if validation failed
   */
  error?: string;

  /**
   * Additional metadata from the validation
   */
  metadata?: Record<string, unknown>;
}
