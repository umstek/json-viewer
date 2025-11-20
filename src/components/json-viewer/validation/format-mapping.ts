/**
 * Format mapping system for explicit format specification via JSONPath patterns
 *
 * This module allows users to explicitly specify data type formats for specific
 * paths in their JSON data. This is useful when:
 * - Auto-detection is insufficient or incorrect
 * - You want to enforce specific format validation
 * - Custom formats need to be applied to specific paths
 *
 * Example:
 * ```typescript
 * const mappings: FormatMapping[] = [
 *   { jsonPath: '$.user.email', format: 'email', priority: 100 },
 *   { jsonPath: /\.phoneNumber$/, format: 'phone', priority: 100 },
 *   { jsonPath: '$.server.ip', format: 'ipv4', priority: 100 },
 * ];
 * ```
 */

import type { ValidationFormat } from '../renderer/advanced/validation';
import { jsonPathToPathArray, pathArrayToJsonPath } from '../utils/jsonpath';

/**
 * Format mapping interface
 *
 * Defines how a specific path or pattern should be formatted and validated.
 */
export interface FormatMapping {
  /**
   * JSONPath pattern to match against
   * - String: Exact JSONPath match (e.g., '$.user.email')
   * - RegExp: Pattern match against full JSONPath string (e.g., /\.email$/)
   */
  jsonPath: string | RegExp;

  /**
   * Format to apply when this mapping matches
   * Can be a standard ValidationFormat or a custom format string
   */
  format: ValidationFormat | string;

  /**
   * Priority level for conflict resolution
   * - Higher priority mappings take precedence
   * - Default: 50 for auto-detection
   * - Recommended: 100 for explicit user mappings
   */
  priority?: number;

  /**
   * Optional custom validator function
   * Returns true if the value is valid for this format
   */
  validator?: (value: unknown) => boolean;
}

/**
 * Default priority levels
 */
export const DEFAULT_PRIORITIES = {
  AUTO_DETECT: 50, // Auto-detection has lower priority
  EXPLICIT_MAPPING: 100, // Explicit user mappings have higher priority
  OVERRIDE: 200, // Highest priority for absolute overrides
} as const;

/**
 * Result of format resolution
 */
export interface FormatResolutionResult {
  /**
   * The resolved format (if any)
   */
  format: ValidationFormat | string | null;

  /**
   * The priority of the resolved format
   */
  priority: number;

  /**
   * The mapping that was matched (if any)
   */
  mapping?: FormatMapping;

  /**
   * Whether the format was auto-detected vs explicitly mapped
   */
  source: 'explicit' | 'auto-detect' | 'none';
}

/**
 * Checks if a path matches a JSONPath pattern
 *
 * @param path - The current path as an array of keys
 * @param pattern - The pattern to match against (string or RegExp)
 * @returns true if the path matches the pattern
 */
export function matchesPath(path: string[], pattern: string | RegExp): boolean {
  // Convert the path array to JSONPath format for matching
  const jsonPath = pathArrayToJsonPath(path);

  if (typeof pattern === 'string') {
    // For string patterns, parse both and compare path arrays
    try {
      const patternPath = jsonPathToPathArray(pattern);
      return pathArraysEqual(path, patternPath);
    } catch {
      // If parsing fails, fall back to exact string match
      return jsonPath === pattern;
    }
  }

  // For RegExp patterns, test against the full JSONPath string
  return pattern.test(jsonPath);
}

/**
 * Compares two path arrays for equality
 */
function pathArraysEqual(path1: string[], path2: string[]): boolean {
  if (path1.length !== path2.length) return false;
  return path1.every((segment, index) => segment === path2[index]);
}

/**
 * Finds all format mappings that match a given path
 *
 * @param path - The current path as an array of keys
 * @param mappings - Array of format mappings to check
 * @returns Array of matching mappings, sorted by priority (highest first)
 */
export function findMatchingMappings(
  path: string[],
  mappings: FormatMapping[],
): FormatMapping[] {
  const matches = mappings.filter((mapping) =>
    matchesPath(path, mapping.jsonPath),
  );

  // Sort by priority (highest first), with default priority of EXPLICIT_MAPPING
  return matches.sort((a, b) => {
    const priorityA = a.priority ?? DEFAULT_PRIORITIES.EXPLICIT_MAPPING;
    const priorityB = b.priority ?? DEFAULT_PRIORITIES.EXPLICIT_MAPPING;
    return priorityB - priorityA;
  });
}

/**
 * Resolves the format for a given value and path
 *
 * Resolution order:
 * 1. Check explicit format mappings (by priority)
 * 2. Apply custom validators if provided
 * 3. Return the highest priority match
 *
 * @param value - The value to resolve format for
 * @param path - The current path as an array of keys
 * @param mappings - Array of format mappings
 * @returns The resolved format information
 */
export function resolveFormat(
  value: unknown,
  path: string[],
  mappings: FormatMapping[],
): FormatResolutionResult {
  // Find all matching mappings
  const matches = findMatchingMappings(path, mappings);

  // Check each matching mapping (already sorted by priority)
  for (const mapping of matches) {
    // If a custom validator is provided, use it
    if (mapping.validator) {
      if (mapping.validator(value)) {
        return {
          format: mapping.format,
          priority: mapping.priority ?? DEFAULT_PRIORITIES.EXPLICIT_MAPPING,
          mapping,
          source: 'explicit',
        };
      }
      // Validator failed, try next mapping
      continue;
    }

    // No validator, accept the mapping
    return {
      format: mapping.format,
      priority: mapping.priority ?? DEFAULT_PRIORITIES.EXPLICIT_MAPPING,
      mapping,
      source: 'explicit',
    };
  }

  // No explicit mappings matched
  return {
    format: null,
    priority: 0,
    source: 'none',
  };
}

/**
 * Helper to create a format mapping with common defaults
 */
export function createFormatMapping(
  jsonPath: string | RegExp,
  format: ValidationFormat | string,
  options: {
    priority?: number;
    validator?: (value: unknown) => boolean;
  } = {},
): FormatMapping {
  return {
    jsonPath,
    format,
    priority: options.priority ?? DEFAULT_PRIORITIES.EXPLICIT_MAPPING,
    validator: options.validator,
  };
}

/**
 * Creates a set of format mappings for common email fields
 */
export function createEmailMappings(priority?: number): FormatMapping[] {
  return [
    createFormatMapping(/\.email$/i, 'email', { priority }),
    createFormatMapping(/\.emailAddress$/i, 'email', { priority }),
    createFormatMapping(/\.mail$/i, 'email', { priority }),
  ];
}

/**
 * Creates a set of format mappings for common phone fields
 */
export function createPhoneMappings(priority?: number): FormatMapping[] {
  return [
    createFormatMapping(/\.phone$/i, 'phone', { priority }),
    createFormatMapping(/\.phoneNumber$/i, 'phone', { priority }),
    createFormatMapping(/\.mobile$/i, 'phone', { priority }),
    createFormatMapping(/\.telephone$/i, 'phone', { priority }),
  ];
}

/**
 * Creates a set of format mappings for common URL fields
 */
export function createUrlMappings(priority?: number): FormatMapping[] {
  return [
    createFormatMapping(/\.url$/i, 'url', { priority }),
    createFormatMapping(/\.link$/i, 'url', { priority }),
    createFormatMapping(/\.website$/i, 'url', { priority }),
    createFormatMapping(/\.homepage$/i, 'url', { priority }),
  ];
}

/**
 * Creates a set of format mappings for common IP address fields
 */
export function createIpMappings(priority?: number): FormatMapping[] {
  return [
    createFormatMapping(/\.ip$/i, 'ipv4', { priority }),
    createFormatMapping(/\.ipAddress$/i, 'ipv4', { priority }),
    createFormatMapping(/\.ipv4$/i, 'ipv4', { priority }),
    createFormatMapping(/\.ipv6$/i, 'ipv6', { priority }),
  ];
}

/**
 * Creates a standard set of format mappings for common field names
 */
export function createStandardMappings(priority?: number): FormatMapping[] {
  return [
    ...createEmailMappings(priority),
    ...createPhoneMappings(priority),
    ...createUrlMappings(priority),
    ...createIpMappings(priority),
  ];
}
