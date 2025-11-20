/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  detectQueryType,
  executeQuery,
  jsonPathToPathArray,
  jsonPointerToPathArray,
  pathArrayToJsonPath,
  pathArrayToJsonPointer,
} from './jsonpath';

describe('JSONPath Utilities', () => {
  describe('pathArrayToJsonPointer', () => {
    it('should convert empty path to empty string', () => {
      expect(pathArrayToJsonPointer([])).toBe('');
    });

    it('should convert simple path to JSON Pointer', () => {
      expect(pathArrayToJsonPointer(['store', 'book', '0', 'title'])).toBe(
        '/store/book/0/title',
      );
    });

    it('should escape special characters', () => {
      expect(pathArrayToJsonPointer(['a~b', 'c/d'])).toBe('/a~0b/c~1d');
    });
  });

  describe('pathArrayToJsonPath', () => {
    it('should convert empty path to $', () => {
      expect(pathArrayToJsonPath([])).toBe('$');
    });

    it('should convert simple path to JSONPath', () => {
      expect(pathArrayToJsonPath(['store', 'book', '0', 'title'])).toBe(
        '$.store.book[0].title',
      );
    });

    it('should handle numeric indices', () => {
      expect(pathArrayToJsonPath(['items', '0', 'name'])).toBe(
        '$.items[0].name',
      );
    });
  });

  describe('jsonPointerToPathArray', () => {
    it('should convert empty string to empty array', () => {
      expect(jsonPointerToPathArray('')).toEqual([]);
    });

    it('should convert # to empty array', () => {
      expect(jsonPointerToPathArray('#')).toEqual([]);
    });

    it('should convert JSON Pointer to path array', () => {
      expect(jsonPointerToPathArray('/store/book/0/title')).toEqual([
        'store',
        'book',
        '0',
        'title',
      ]);
    });

    it('should unescape special characters', () => {
      expect(jsonPointerToPathArray('/a~0b/c~1d')).toEqual(['a~b', 'c/d']);
    });
  });

  describe('jsonPathToPathArray', () => {
    it('should convert $ to empty array', () => {
      expect(jsonPathToPathArray('$')).toEqual([]);
    });

    it('should convert dot notation', () => {
      expect(jsonPathToPathArray('$.store.book')).toEqual(['store', 'book']);
    });

    it('should convert bracket notation with numbers', () => {
      expect(jsonPathToPathArray('$.items[0].name')).toEqual([
        'items',
        '0',
        'name',
      ]);
    });

    it('should convert bracket notation with strings', () => {
      expect(jsonPathToPathArray('$["store"]["book"]')).toEqual([
        'store',
        'book',
      ]);
    });

    it('should convert mixed notation', () => {
      expect(jsonPathToPathArray('$.store.book[0].title')).toEqual([
        'store',
        'book',
        '0',
        'title',
      ]);
    });

    it('should handle single quotes', () => {
      expect(jsonPathToPathArray("$['store']['book']")).toEqual([
        'store',
        'book',
      ]);
    });
  });

  describe('detectQueryType', () => {
    it('should detect JSON Pointer', () => {
      expect(detectQueryType('/store/book')).toBe('json-pointer');
    });

    it('should detect JSONPath', () => {
      expect(detectQueryType('$.store.book')).toBe('jsonpath');
    });

    it('should detect text search', () => {
      expect(detectQueryType('search term')).toBe('text');
    });
  });

  describe('executeQuery', () => {
    const testData = {
      store: {
        book: [
          { title: 'Book One', author: 'John Doe', price: 10.5 },
          { title: 'Book Two', author: 'Jane Smith', price: 15.99 },
        ],
        bicycle: { color: 'red', price: 99.99 },
      },
      user: {
        name: 'Alice',
        email: 'alice@example.com',
      },
    };

    describe('JSON Pointer queries', () => {
      it('should query with JSON Pointer', () => {
        const results = executeQuery(testData, '/store/book/0/title');
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe('Book One');
        expect(results[0].path).toEqual(['store', 'book', '0', 'title']);
      });

      it('should return empty for non-existent path', () => {
        const results = executeQuery(testData, '/nonexistent/path');
        expect(results).toHaveLength(0);
      });
    });

    describe('JSONPath queries', () => {
      it('should query with JSONPath', () => {
        const results = executeQuery(testData, '$.store.book[0].title');
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe('Book One');
        expect(results[0].path).toEqual(['store', 'book', '0', 'title']);
      });

      it('should query nested object', () => {
        const results = executeQuery(testData, '$.user.name');
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe('Alice');
      });

      it('should return empty for non-existent path', () => {
        const results = executeQuery(testData, '$.nonexistent.path');
        expect(results).toHaveLength(0);
      });
    });

    describe('Text search queries', () => {
      it('should find text in keys', () => {
        const results = executeQuery(testData, 'book');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((r) => r.path.includes('book'))).toBe(true);
      });

      it('should find text in string values', () => {
        const results = executeQuery(testData, 'Alice');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((r) => r.value === 'Alice')).toBe(true);
      });

      it('should be case insensitive', () => {
        const results = executeQuery(testData, 'ALICE');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((r) => r.value === 'Alice')).toBe(true);
      });

      it('should return empty for no matches', () => {
        const results = executeQuery(testData, 'nonexistent');
        expect(results).toHaveLength(0);
      });
    });

    it('should return empty for empty query', () => {
      const results = executeQuery(testData, '');
      expect(results).toHaveLength(0);
    });
  });
});
