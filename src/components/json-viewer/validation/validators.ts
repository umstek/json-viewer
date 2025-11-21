/**
 * Format validation - only formats with actionable UI
 *
 * Each format detected here has a PURPOSE:
 * - email → mailto: link
 * - phone → tel: link
 * - url → clickable, image preview
 * - date → timezone display
 * - ipv4 → segmented display
 * - uuid → copy button
 */

import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

// Only actionable formats
export type ActionableFormat =
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'date-time'
  | 'ipv4'
  | 'uuid';

export interface FormatResult {
  format: ActionableFormat;
  action: string; // What you can DO with it
}

// Zod schemas for validation
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();
const ipv4Schema = z.string().ip({ version: 'v4' });
const dateSchema = z.string().date();
const dateTimeSchema = z.string().datetime({ offset: true });

// Validators
export const validateEmail = (v: string) => emailSchema.safeParse(v).success;
export const validateUrl = (v: string) => urlSchema.safeParse(v).success;
export const validateUuid = (v: string) => uuidSchema.safeParse(v).success;
export const validateIpv4 = (v: string) => ipv4Schema.safeParse(v).success;
export const validateDate = (v: string) => dateSchema.safeParse(v).success;
export const validateDateTime = (v: string) =>
  dateTimeSchema.safeParse(v).success;

// Phone validation - more lenient
// libphonenumber-js is strict, so we also accept common patterns
export function validatePhone(value: string): boolean {
  // First try libphonenumber-js (handles international formats)
  try {
    if (isValidPhoneNumber(value)) return true;
    // Try with US country code if no country specified
    if (isValidPhoneNumber(value, 'US')) return true;
  } catch {
    // ignore
  }

  // Fallback: common phone patterns (10+ digits with optional formatting)
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    // Must look like a phone number (has separators or starts with +)
    if (/^[+\d][\d\s().-]{8,}$/.test(value)) {
      return true;
    }
  }

  return false;
}

// Get phone metadata for display
export function getPhoneMetadata(value: string) {
  try {
    const phone = parsePhoneNumber(value) || parsePhoneNumber(value, 'US');
    if (phone) {
      return {
        formatted: phone.formatInternational(),
        country: phone.country,
        uri: phone.getURI(),
      };
    }
  } catch {
    // Return basic tel: URI
  }
  return { uri: `tel:${value.replace(/\D/g, '')}` };
}

/**
 * Detect format - only if there's something useful to DO with it
 */
export function detectFormat(value: string): FormatResult | null {
  if (!value || typeof value !== 'string' || value.length < 3) {
    return null;
  }

  // Order matters - check more specific patterns first

  // Date/DateTime - show in different timezones
  if (validateDateTime(value)) {
    return { format: 'date-time', action: 'Show in timezones' };
  }
  if (validateDate(value)) {
    return { format: 'date', action: 'Show in calendar' };
  }

  // Email - mailto link
  if (validateEmail(value)) {
    return { format: 'email', action: 'Send email' };
  }

  // URL - click to open, preview if image
  if (validateUrl(value)) {
    return { format: 'url', action: 'Open link' };
  }

  // UUID - copy button
  if (validateUuid(value)) {
    return { format: 'uuid', action: 'Copy' };
  }

  // IPv4 - segmented display
  if (validateIpv4(value)) {
    return { format: 'ipv4', action: 'Show segments' };
  }

  // Phone - call button (check last, most permissive)
  if (validatePhone(value)) {
    return { format: 'phone', action: 'Call' };
  }

  return null;
}
