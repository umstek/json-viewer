/**
 * Validation renderer for common string formats
 *
 * This renderer detects and validates common string formats like email, URL, date, UUID, etc.
 * It shows visual indicators (icons, colors) for valid/invalid formats and provides
 * detailed information in tooltips.
 */

import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Globe,
  Hash,
  Mail,
  Phone,
  XCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

/**
 * Supported validation formats
 */
export type ValidationFormat =
  | 'email'
  | 'url'
  | 'uri'
  | 'date'
  | 'date-time'
  | 'time'
  | 'uuid'
  | 'ipv4'
  | 'ipv6'
  | 'phone'
  | 'credit-card';

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  format: ValidationFormat;
  message: string;
  icon: LucideIcon;
  iconColor: string;
}

/**
 * Options for the validation renderer
 */
export interface ValidationRendererOptions {
  /**
   * Whether to enable auto-detection of formats
   * Default: true
   */
  autoDetect?: boolean;

  /**
   * Explicitly specified format (overrides auto-detection)
   */
  explicitFormat?: ValidationFormat;

  /**
   * Whether to show validation for valid values
   * Default: true
   */
  showValid?: boolean;

  /**
   * Whether to show validation for invalid values
   * Default: true
   */
  showInvalid?: boolean;
}

/**
 * Detects the format of a string value
 * Reuses patterns from the schema infrastructure
 */
function detectFormat(value: string): ValidationFormat | undefined {
  // Date only (check before date-time)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'date';
  }

  // ISO 8601 date/datetime
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(
      value,
    )
  ) {
    return 'date-time';
  }

  // Time only
  if (/^\d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(value)) {
    return 'time';
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  // URL
  if (/^https?:\/\/.+/.test(value)) {
    return 'url';
  }

  // UUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return 'uuid';
  }

  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    // Validate that each octet is 0-255
    const octets = value.split('.').map(Number);
    if (octets.every((octet) => octet >= 0 && octet <= 255)) {
      return 'ipv4';
    }
  }

  // IPv6 (simplified pattern - full IPv6 validation is complex)
  if (/^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i.test(value)) {
    return 'ipv6';
  }

  // Phone number (international format with optional country code)
  // Matches: +1234567890, +1-234-567-8900, (123) 456-7890, etc.
  if (
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(
      value,
    )
  ) {
    // Only consider it a phone if it has at least 10 digits
    const digitCount = value.replace(/\D/g, '').length;
    if (digitCount >= 10 && digitCount <= 15) {
      return 'phone';
    }
  }

  // Credit card (Luhn algorithm would be ideal, but basic pattern check for now)
  // Matches: 16 digits with optional spaces or dashes
  if (/^(\d{4}[\s-]?){3}\d{4}$/.test(value)) {
    const digits = value.replace(/[\s-]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && /^\d+$/.test(digits)) {
      return 'credit-card';
    }
  }

  return undefined;
}

/**
 * Validates a string value against a specific format
 */
function validateFormat(
  value: string,
  format: ValidationFormat,
): ValidationResult {
  let isValid = false;
  let message = '';
  let icon: LucideIcon = XCircle;
  let iconColor = 'text-red-500';

  switch (format) {
    case 'email': {
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      message = isValid
        ? `Valid email address: ${value}`
        : 'Invalid email address format';
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'url':
    case 'uri': {
      isValid = /^https?:\/\/.+/.test(value);
      if (isValid) {
        try {
          const url = new URL(value);
          message = `Valid URL: ${url.protocol}//${url.host}`;
        } catch {
          isValid = false;
          message = 'Invalid URL format';
        }
      } else {
        message = 'Invalid URL format (must start with http:// or https://)';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'date': {
      isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);
      if (isValid) {
        try {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            isValid = false;
            message = 'Invalid date value';
          } else {
            message = `Valid date (ISO 8601): ${date.toLocaleDateString()}`;
          }
        } catch {
          isValid = false;
          message = 'Invalid date format';
        }
      } else {
        message = 'Invalid date format (expected YYYY-MM-DD)';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'date-time': {
      isValid =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(
          value,
        );
      if (isValid) {
        try {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            isValid = false;
            message = 'Invalid datetime value';
          } else {
            message = `Valid ISO 8601 datetime: ${date.toLocaleString()}`;
          }
        } catch {
          isValid = false;
          message = 'Invalid datetime format';
        }
      } else {
        message = 'Invalid datetime format (expected ISO 8601)';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'time': {
      isValid = /^\d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(value);
      message = isValid
        ? `Valid time format (HH:MM:SS): ${value}`
        : 'Invalid time format (expected HH:MM:SS)';
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'uuid': {
      isValid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        );
      if (isValid) {
        const version = Number.parseInt(value.charAt(14), 16);
        message = `Valid UUID (version ${version})`;
      } else {
        message = 'Invalid UUID format';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'ipv4': {
      isValid = /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
      if (isValid) {
        const octets = value.split('.').map(Number);
        isValid = octets.every((octet) => octet >= 0 && octet <= 255);
        message = isValid
          ? `Valid IPv4 address: ${value}`
          : 'Invalid IPv4 address (octets must be 0-255)';
      } else {
        message = 'Invalid IPv4 address format';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'ipv6': {
      isValid = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i.test(value);
      message = isValid
        ? `Valid IPv6 address: ${value}`
        : 'Invalid IPv6 address format';
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'phone': {
      const digitCount = value.replace(/\D/g, '').length;
      isValid = digitCount >= 10 && digitCount <= 15;
      message = isValid
        ? `Valid phone number (${digitCount} digits)`
        : `Invalid phone number (expected 10-15 digits, got ${digitCount})`;
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    case 'credit-card': {
      const digits = value.replace(/[\s-]/g, '');
      isValid =
        digits.length >= 13 && digits.length <= 19 && /^\d+$/.test(digits);
      if (isValid) {
        // Apply Luhn algorithm for more accurate validation
        isValid = luhnCheck(digits);
        message = isValid
          ? `Valid credit card number (${digits.length} digits)`
          : 'Invalid credit card number (failed Luhn check)';
      } else {
        message = 'Invalid credit card format (expected 13-19 digits)';
      }
      icon = isValid ? CheckCircle : XCircle;
      iconColor = isValid ? 'text-green-500' : 'text-red-500';
      break;
    }

    default: {
      icon = AlertCircle;
      iconColor = 'text-yellow-500';
      message = `Unknown format: ${format}`;
    }
  }

  return { isValid, format, message, icon, iconColor };
}

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost digit
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cardNumber.charAt(i), 10);

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
}

/**
 * Gets the icon for a format
 */
function getFormatIcon(format: ValidationFormat): LucideIcon {
  switch (format) {
    case 'email':
      return Mail;
    case 'url':
    case 'uri':
      return Globe;
    case 'phone':
      return Phone;
    case 'credit-card':
      return CreditCard;
    case 'uuid':
    case 'ipv4':
    case 'ipv6':
      return Hash;
    default:
      return AlertCircle;
  }
}

/**
 * Creates a validation renderer with the given options
 */
export function createValidationRenderer(
  options: ValidationRendererOptions = {},
): Renderer {
  const {
    autoDetect = true,
    explicitFormat,
    showValid = true,
    showInvalid = true,
  } = options;

  return ({ value }) => {
    // Only validate strings
    if (typeof value !== 'string') return null;

    // Determine the format to validate
    let format: ValidationFormat | undefined = explicitFormat;
    if (!format && autoDetect) {
      format = detectFormat(value);
    }

    // If no format detected or specified, don't render
    if (!format) return null;

    // Validate the value
    const result = validateFormat(value, format);

    // Filter based on validation result and options
    if (!result.isValid && !showInvalid) return null;
    if (result.isValid && !showValid) return null;

    const formatIcon = getFormatIcon(format);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-2">
              <GenericRenderer icon={formatIcon} type={format} value={value}>
                <div className="flex items-center gap-2">
                  <pre className="font-mono text-sm">{value}</pre>
                  <result.icon className={`h-4 w-4 ${result.iconColor}`} />
                </div>
              </GenericRenderer>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1 text-sm">
              <div className="font-semibold">
                Format: {format.toUpperCase()}
              </div>
              <div>{result.message}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
}

/**
 * Default validation renderer with auto-detection enabled
 */
export const defaultValidationRenderer = createValidationRenderer();
