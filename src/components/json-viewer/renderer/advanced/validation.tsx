/**
 * Validation renderer for common string formats
 *
 * Uses Zod-based validators for format detection and validation.
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
import {
  detectFormat as detectFormatZod,
  type ValidationFormat,
  validateFormat as validateFormatZod,
} from '../../validation';
import {
  DEFAULT_PRIORITIES,
  type FormatMapping,
  resolveFormat,
} from '../../validation/format-mapping';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

/**
 * Options for the validation renderer
 */
export interface ValidationRendererOptions {
  /** Whether to enable auto-detection of formats (default: true) */
  autoDetect?: boolean;
  /** Explicitly specified format (overrides auto-detection) */
  explicitFormat?: ValidationFormat;
  /** Whether to show validation for valid values (default: true) */
  showValid?: boolean;
  /** Whether to show validation for invalid values (default: true) */
  showInvalid?: boolean;
  /** Format mappings for explicit path-based format specification */
  formatMappings?: FormatMapping[];
}

// Formats supported by this renderer's UI
const SUPPORTED_FORMATS = new Set([
  'email',
  'url',
  'uri',
  'date',
  'date-time',
  'time',
  'uuid',
  'ipv4',
  'ipv6',
  'phone',
  'credit-card',
]);

/**
 * Gets the icon for a format
 */
function getFormatIcon(format: string): LucideIcon {
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
    default:
      return Hash;
  }
}

/**
 * Gets display message for a validated format
 */
function getValidationMessage(
  value: string,
  format: string,
  isValid: boolean,
): string {
  if (!isValid) {
    return `Invalid ${format} format`;
  }

  switch (format) {
    case 'email':
      return `Valid email: ${value}`;
    case 'url':
    case 'uri':
      try {
        const url = new URL(value);
        return `Valid URL: ${url.protocol}//${url.host}`;
      } catch {
        return `Valid URL: ${value}`;
      }
    case 'date':
      try {
        return `Valid date: ${new Date(value).toLocaleDateString()}`;
      } catch {
        return `Valid date: ${value}`;
      }
    case 'date-time':
      try {
        return `Valid datetime: ${new Date(value).toLocaleString()}`;
      } catch {
        return `Valid datetime: ${value}`;
      }
    case 'time':
      return `Valid time: ${value}`;
    case 'uuid': {
      const version = Number.parseInt(value.charAt(14), 16);
      return `Valid UUID (v${version})`;
    }
    case 'ipv4':
      return `Valid IPv4: ${value}`;
    case 'ipv6':
      return `Valid IPv6: ${value}`;
    case 'phone':
      return `Valid phone number`;
    case 'credit-card':
      return `Valid credit card`;
    default:
      return `Valid ${format}`;
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
    formatMappings = [],
  } = options;

  return ({ value, path }) => {
    if (typeof value !== 'string') return null;

    // Determine format: explicit > mappings > auto-detect
    let format: string | undefined = explicitFormat;
    let formatSource: 'explicit' | 'mapping' | 'auto-detect' = 'explicit';

    if (!format && formatMappings.length > 0) {
      const resolution = resolveFormat(value, path, formatMappings);
      if (
        resolution.format &&
        resolution.priority >= DEFAULT_PRIORITIES.AUTO_DETECT
      ) {
        format = resolution.format;
        formatSource = 'mapping';
      }
    }

    if (!format && autoDetect) {
      const detected = detectFormatZod(value);
      if (detected) {
        format = detected.format;
        formatSource = 'auto-detect';
      }
    }

    if (!format) return null;

    // For unsupported formats, show info badge
    if (!SUPPORTED_FORMATS.has(format)) {
      const formatIcon = getFormatIcon(format);
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2">
                <GenericRenderer icon={formatIcon} type={format} value={value}>
                  <div className="flex items-center gap-2">
                    <pre className="font-mono text-sm">{value}</pre>
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  </div>
                </GenericRenderer>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-semibold">
                  Format: {format.toUpperCase()}
                </div>
                <div>Custom format (from {formatSource})</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Validate using Zod
    const result = validateFormatZod(value, format as ValidationFormat);
    const isValid = result.valid;

    if (!isValid && !showInvalid) return null;
    if (isValid && !showValid) return null;

    const formatIcon = getFormatIcon(format);
    const StatusIcon = isValid ? CheckCircle : XCircle;
    const iconColor = isValid ? 'text-green-500' : 'text-red-500';
    const message = getValidationMessage(value, format, isValid);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-2">
              <GenericRenderer icon={formatIcon} type={format} value={value}>
                <div className="flex items-center gap-2">
                  <pre className="font-mono text-sm">{value}</pre>
                  <StatusIcon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </GenericRenderer>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-semibold">
                Format: {format.toUpperCase()}
              </div>
              <div>{message}</div>
              {formatSource === 'mapping' && (
                <div className="text-muted-foreground text-xs">
                  (from format mapping)
                </div>
              )}
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

// Re-export ValidationFormat type for convenience
export type { ValidationFormat };
