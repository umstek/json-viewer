import { describe, expect, it } from 'vitest';
import {
  convertToFormat,
  getFileExtension,
  getMimeType,
} from './export-formats';

describe('export-formats', () => {
  describe('convertToFormat', () => {
    const testData = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
      hobbies: ['reading', 'coding', 'gaming'],
      active: true,
      balance: null,
    };

    it('should convert to formatted JSON', () => {
      const result = convertToFormat(testData, 'json');
      expect(result).toContain('"name": "John Doe"');
      expect(result).toContain('  '); // Check for indentation
    });

    it('should convert to minified JSON', () => {
      const result = convertToFormat(testData, 'json-minified');
      expect(result).not.toContain('\n'); // No newlines in minified
      expect(result).toContain('"name":"John Doe"');
    });

    it('should convert to YAML', () => {
      const result = convertToFormat(testData, 'yaml');
      expect(result).toContain('name: John Doe');
      expect(result).toContain('age: 30');
      expect(result).toContain('address:');
      expect(result).toContain('  street: 123 Main St');
    });

    it('should convert to CSV with flattened structure', () => {
      const result = convertToFormat(testData, 'csv');
      // Check headers
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).toContain('address.street');
      expect(result).toContain('address.city');
      // Check values
      expect(result).toContain('John Doe');
      expect(result).toContain('30');
      expect(result).toContain('123 Main St');
    });

    it('should handle array data for CSV', () => {
      const arrayData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const result = convertToFormat(arrayData, 'csv');
      expect(result).toContain('id,name');
      expect(result).toContain('1,Alice');
      expect(result).toContain('2,Bob');
    });

    it('should handle nested arrays in CSV', () => {
      const nestedData = {
        users: [
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 },
        ],
      };
      const result = convertToFormat(nestedData, 'csv');
      expect(result).toContain('users[0].name');
      expect(result).toContain('users[1].name');
    });

    it('should handle primitive arrays in CSV', () => {
      const data = { tags: ['one', 'two', 'three'] };
      const result = convertToFormat(data, 'csv');
      expect(result).toContain('tags');
      // papaparse properly escapes the JSON array with CSV quote escaping
      expect(result).toMatch(
        /\["one","two","three"\]|"?\[""one"",""two"",""three""\]"?/,
      );
    });

    it('should escape CSV values with commas', () => {
      const data = { description: 'Hello, World!' };
      const result = convertToFormat(data, 'csv');
      expect(result).toContain('"Hello, World!"');
    });

    it('should escape CSV values with quotes', () => {
      const data = { quote: 'He said "Hello"' };
      const result = convertToFormat(data, 'csv');
      expect(result).toContain('He said ""Hello""');
    });

    it('should handle null values', () => {
      const data = { value: null };
      const resultJSON = convertToFormat(data, 'json');
      expect(resultJSON).toContain('"value": null');

      const resultYAML = convertToFormat(data, 'yaml');
      expect(resultYAML).toContain('value: null');

      const resultCSV = convertToFormat(data, 'csv');
      expect(resultCSV).toContain('value');
    });

    it('should handle empty objects', () => {
      const data = {};
      const resultJSON = convertToFormat(data, 'json');
      expect(resultJSON).toBe('{}');

      const resultYAML = convertToFormat(data, 'yaml');
      // js-yaml adds a newline at the end, which is standard YAML
      expect(resultYAML).toBe('{}\n');

      const resultCSV = convertToFormat(data, 'csv');
      expect(resultCSV).toContain('value');
    });

    it('should handle empty arrays', () => {
      const data: unknown[] = [];
      const resultCSV = convertToFormat(data, 'csv');
      expect(resultCSV).toBe('');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types', () => {
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('json-minified')).toBe('application/json');
      expect(getMimeType('yaml')).toBe('text/yaml');
      expect(getMimeType('csv')).toBe('text/csv');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct file extensions', () => {
      expect(getFileExtension('json')).toBe('json');
      expect(getFileExtension('json-minified')).toBe('json');
      expect(getFileExtension('yaml')).toBe('yaml');
      expect(getFileExtension('csv')).toBe('csv');
    });
  });
});
