/**
 * Utility functions for JSONPath and JSON Pointer (RFC 6901) support
 */

export interface QueryResult {
  path: string[]; // Path as array of keys
  value: unknown; // Value at this path
  jsonPointer: string; // RFC 6901 JSON Pointer format
  jsonPath: string; // JSONPath format
}

/**
 * Converts a path array to a JSON Pointer (RFC 6901) string
 * Example: ['store', 'book', '0', 'title'] => '/store/book/0/title'
 */
export function pathArrayToJsonPointer(path: string[]): string {
  if (path.length === 0) return '';
  return `/${path.map(encodeJsonPointerToken).join('/')}`;
}

/**
 * Encodes a token for use in JSON Pointer (RFC 6901)
 * Escapes ~ and / characters as per RFC 6901
 */
function encodeJsonPointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Decodes a JSON Pointer token (RFC 6901)
 */
function decodeJsonPointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Converts a path array to JSONPath format
 * Example: ['store', 'book', '0', 'title'] => '$.store.book[0].title'
 */
export function pathArrayToJsonPath(path: string[]): string {
  if (path.length === 0) return '$';

  let result = '$';
  for (const segment of path) {
    // Check if segment is a number (array index)
    if (/^\d+$/.test(segment)) {
      result += `[${segment}]`;
    } else {
      // Property access
      result += `.${segment}`;
    }
  }
  return result;
}

/**
 * Parses a JSON Pointer (RFC 6901) string to a path array
 * Example: '/store/book/0/title' => ['store', 'book', '0', 'title']
 */
export function jsonPointerToPathArray(pointer: string): string[] {
  // Empty string or just '#' refers to the root
  if (pointer === '' || pointer === '#') return [];

  // Remove leading slash
  const normalized = pointer.startsWith('/') ? pointer.slice(1) : pointer;
  if (normalized === '') return [];

  return normalized.split('/').map(decodeJsonPointerToken);
}

/**
 * Parses a JSONPath expression to path arrays
 * Supports basic JSONPath syntax:
 * - $ (root)
 * - .property or ['property']
 * - [index] for arrays
 * - Bracket notation with quotes
 *
 * Note: This is a lightweight implementation supporting common cases.
 * For advanced features like filters, wildcards, and recursive descent,
 * consider using the jsonpath-plus library.
 */
export function jsonPathToPathArray(jsonPath: string): string[] {
  // Handle root
  if (jsonPath === '$') return [];

  // Remove leading $ if present
  const normalized = jsonPath.startsWith('$') ? jsonPath.slice(1) : jsonPath;
  if (normalized === '') return [];

  const path: string[] = [];
  let current = '';
  let inBracket = false;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuote) {
      if (char === quoteChar && normalized[i - 1] !== '\\') {
        inQuote = false;
      } else if (char !== quoteChar) {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === '[') {
      if (current) {
        path.push(current);
        current = '';
      }
      inBracket = true;
    } else if (char === ']') {
      if (current) {
        path.push(current);
        current = '';
      }
      inBracket = false;
    } else if (char === '.' && !inBracket) {
      if (current) {
        path.push(current);
        current = '';
      }
    } else if (char !== ' ' || inBracket) {
      // Skip spaces outside brackets
      current += char;
    }
  }

  if (current) {
    path.push(current);
  }

  return path;
}

/**
 * Detects the query type based on the input string
 */
export function detectQueryType(
  query: string,
): 'json-pointer' | 'jsonpath' | 'text' {
  if (query.startsWith('/')) return 'json-pointer';
  if (query.startsWith('$')) return 'jsonpath';
  return 'text';
}

/**
 * Gets a value from an object using a path array
 */
function getValueByPath(obj: unknown, path: string[]): unknown {
  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;

    if (Array.isArray(current)) {
      const index = Number.parseInt(key, 10);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[key];
    }
  }

  return current;
}

/**
 * Recursively finds all paths in an object that match a text search query
 */
function findPathsByTextSearch(
  obj: unknown,
  searchQuery: string,
  currentPath: string[] = [],
): QueryResult[] {
  const results: QueryResult[] = [];
  const lowerQuery = searchQuery.toLowerCase();

  if (obj === null || obj === undefined) return results;

  if (typeof obj === 'object') {
    const entries = Array.isArray(obj)
      ? obj.map((val, idx) => [String(idx), val] as [string, unknown])
      : Object.entries(obj);

    for (const [key, value] of entries) {
      const path = [...currentPath, key];

      // Search in key
      if (key.toLowerCase().includes(lowerQuery)) {
        results.push({
          path,
          value,
          jsonPointer: pathArrayToJsonPointer(path),
          jsonPath: pathArrayToJsonPath(path),
        });
      }

      // Search in string values
      if (
        typeof value === 'string' &&
        value.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          path,
          value,
          jsonPointer: pathArrayToJsonPointer(path),
          jsonPath: pathArrayToJsonPath(path),
        });
      }

      // Recurse into nested objects/arrays
      if (value && typeof value === 'object') {
        results.push(...findPathsByTextSearch(value, lowerQuery, path));
      }
    }
  }

  return results;
}

/**
 * Executes a query and returns matching results
 * Supports:
 * - JSON Pointer (RFC 6901): /path/to/value
 * - JSONPath: $.path.to.value or $.path[0].value
 * - Text search: any string (searches keys and values)
 */
export function executeQuery(data: unknown, query: string): QueryResult[] {
  if (!query) return [];

  const queryType = detectQueryType(query);

  try {
    if (queryType === 'json-pointer') {
      // Parse JSON Pointer and return single result
      const path = jsonPointerToPathArray(query);
      const value = getValueByPath(data, path);

      if (value !== undefined) {
        return [
          {
            path,
            value,
            jsonPointer: pathArrayToJsonPointer(path),
            jsonPath: pathArrayToJsonPath(path),
          },
        ];
      }
      return [];
    }

    if (queryType === 'jsonpath') {
      // Parse JSONPath and return single result
      const path = jsonPathToPathArray(query);
      const value = getValueByPath(data, path);

      if (value !== undefined) {
        return [
          {
            path,
            value,
            jsonPointer: pathArrayToJsonPointer(path),
            jsonPath: pathArrayToJsonPath(path),
          },
        ];
      }
      return [];
    }

    // Text search - find all matching paths
    return findPathsByTextSearch(data, query);
  } catch (error) {
    console.error('Query execution error:', error);
    return [];
  }
}

/**
 * Normalizes a path string (dot-separated) to a path array
 * Example: 'store.book.0.title' => ['store', 'book', '0', 'title']
 */
export function dotPathToPathArray(dotPath: string): string[] {
  if (!dotPath) return [];
  return dotPath.split('.');
}
