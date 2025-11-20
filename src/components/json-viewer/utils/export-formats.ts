/**
 * Export utilities for converting and downloading JSON data in various formats
 */

export type ExportFormat = 'json' | 'json-minified' | 'yaml' | 'csv';

/**
 * Converts a value to a YAML string representation
 * Simple implementation that handles common JSON types
 */
function toYAML(data: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (data === null) {
    return 'null';
  }

  if (data === undefined) {
    return 'null';
  }

  if (typeof data === 'string') {
    // Handle strings that need quoting
    if (
      data.includes('\n') ||
      data.includes(':') ||
      data.includes('#') ||
      data.includes('[') ||
      data.includes(']') ||
      data.includes('{') ||
      data.includes('}') ||
      data.includes(',') ||
      data.includes('&') ||
      data.includes('*') ||
      data.includes('!') ||
      data.includes('|') ||
      data.includes('>') ||
      data.includes("'") ||
      data.includes('"') ||
      data.includes('%') ||
      data.includes('@') ||
      data.includes('`') ||
      data.trim() !== data ||
      data.match(/^\d+$/) ||
      data.toLowerCase() === 'true' ||
      data.toLowerCase() === 'false' ||
      data.toLowerCase() === 'null' ||
      data === ''
    ) {
      // Use double quotes and escape internal quotes
      return `"${data.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]';
    }

    // Check if all items are primitives
    const allPrimitives = data.every(
      (item) =>
        item === null || ['string', 'number', 'boolean'].includes(typeof item),
    );

    if (allPrimitives) {
      // Inline array notation
      return `[${data.map((item) => toYAML(item, 0)).join(', ')}]`;
    }

    // Multi-line array notation
    return data
      .map((item) => {
        const itemYAML = toYAML(item, indent + 1);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          // For objects, format as nested structure
          const lines = itemYAML.split('\n');
          return `${spaces}- ${lines[0]}\n${lines.slice(1).join('\n')}`;
        }
        return `${spaces}- ${itemYAML}`;
      })
      .join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);

    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, value]) => {
        // Quote key if necessary
        const quotedKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
          ? key
          : `"${key}"`;

        if (typeof value === 'object' && value !== null) {
          const valueYAML = toYAML(value, indent + 1);
          if (Array.isArray(value) && value.length > 0) {
            // Array values on next line
            return `${spaces}${quotedKey}:\n${valueYAML}`;
          }
          if (Object.keys(value).length === 0) {
            return `${spaces}${quotedKey}: {}`;
          }
          // Object values on next line
          return `${spaces}${quotedKey}:\n${valueYAML}`;
        }

        // Primitive values inline
        return `${spaces}${quotedKey}: ${toYAML(value, 0)}`;
      })
      .join('\n');
  }

  return String(data);
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
 * Converts data to CSV format
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

  // Get all unique keys (column headers)
  const allKeys = new Set<string>();
  for (const row of flatData) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  const headers = Array.from(allKeys).sort();

  // Escape CSV value
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  // Build CSV
  const lines: string[] = [];

  // Header row
  lines.push(headers.map(escapeCSV).join(','));

  // Data rows
  for (const row of flatData) {
    const values = headers.map((header) => escapeCSV(row[header]));
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Converts data to the specified format
 */
export function convertToFormat(data: unknown, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'json-minified':
      return JSON.stringify(data);

    case 'yaml':
      return toYAML(data);

    case 'csv':
      return toCSV(data);

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
