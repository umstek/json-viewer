/**
 * Export utilities for converting and downloading JSON data in various formats
 */

import yaml from 'js-yaml';
import Papa from 'papaparse';
import {
  cloneWithoutCircular,
  hasCircularReference,
  safeStringify,
} from './circular-detection';

export type ExportFormat = 'json' | 'json-minified' | 'yaml' | 'csv';

/**
 * Converts a value to a YAML string representation using js-yaml library
 */
function toYAML(data: unknown): string {
  return yaml.dump(data, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: true, // Don't use references
    sortKeys: false, // Preserve key order
  });
}

/**
 * Flattens a nested object into a flat structure with dot-notation keys
 * @example { user: { name: 'John', age: 30 } } => { 'user.name': 'John', 'user.age': 30 }
 */
function flattenObject(
  obj: unknown,
  prefix = '',
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  if (obj === null || obj === undefined) {
    result[prefix || 'value'] = obj;
    return result;
  }

  if (typeof obj !== 'object') {
    result[prefix || 'value'] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      result[prefix] = '[]';
      return result;
    }

    // Check if array contains only primitives
    const allPrimitives = obj.every(
      (item) => item === null || typeof item !== 'object',
    );

    if (allPrimitives) {
      result[prefix] = JSON.stringify(obj);
      return result;
    }

    // Flatten array items with index
    for (let i = 0; i < obj.length; i++) {
      const key = prefix ? `${prefix}[${i}]` : `[${i}]`;
      flattenObject(obj[i], key, result);
    }
    return result;
  }

  // Handle objects
  const entries = Object.entries(obj as Record<string, unknown>);

  if (entries.length === 0) {
    result[prefix || 'value'] = '{}';
    return result;
  }

  for (const [key, value] of entries) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined || typeof value !== 'object') {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else if (typeof value === 'object') {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Converts data to CSV format using papaparse
 * Flattens nested objects and arrays using dot notation
 */
function toCSV(data: unknown): string {
  let flatData: Record<string, unknown>[];

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '';
    }
    // Flatten each object in the array
    flatData = data.map((item) => flattenObject(item));
  } else {
    // Single object - wrap in array
    flatData = [flattenObject(data)];
  }

  // Get all unique keys (column headers) and sort them
  const allKeys = new Set<string>();
  for (const row of flatData) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  const headers = Array.from(allKeys).sort();

  // Normalize data so all rows have the same keys in the same order
  const normalizedData = flatData.map((row) => {
    const normalizedRow: Record<string, unknown> = {};
    for (const header of headers) {
      normalizedRow[header] = row[header];
    }
    return normalizedRow;
  });

  // Use papaparse to convert to CSV
  return Papa.unparse(normalizedData, {
    columns: headers,
    header: true,
  });
}

/**
 * Converts data to the specified format
 * Handles circular references safely by replacing them with a placeholder
 */
export function convertToFormat(data: unknown, format: ExportFormat): string {
  // Handle circular references for all formats
  const safeData = hasCircularReference(data)
    ? cloneWithoutCircular(data)
    : data;

  switch (format) {
    case 'json':
      return safeStringify(safeData, 2);

    case 'json-minified':
      return safeStringify(safeData, 0);

    case 'yaml':
      return toYAML(safeData);

    case 'csv':
      return toCSV(safeData);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Gets the MIME type for a given export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json':
    case 'json-minified':
      return 'application/json';

    case 'yaml':
      return 'text/yaml';

    case 'csv':
      return 'text/csv';

    default:
      return 'text/plain';
  }
}

/**
 * Gets the file extension for a given export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
    case 'json-minified':
      return 'json';

    case 'yaml':
      return 'yaml';

    case 'csv':
      return 'csv';

    default:
      return 'txt';
  }
}

/**
 * Triggers a browser download of the given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  // Create blob
  const blob = new Blob([content], { type: mimeType });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data in the specified format
 */
export function exportData(
  data: unknown,
  format: ExportFormat,
  baseFilename = 'data',
): void {
  try {
    const content = convertToFormat(data, format);
    const extension = getFileExtension(format);
    const mimeType = getMimeType(format);
    const filename = `${baseFilename}.${extension}`;

    downloadFile(content, filename, mimeType);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Format labels for display in UI
 */
export const formatLabels: Record<ExportFormat, string> = {
  json: 'JSON (formatted)',
  'json-minified': 'JSON (minified)',
  yaml: 'YAML',
  csv: 'CSV (flattened)',
};
