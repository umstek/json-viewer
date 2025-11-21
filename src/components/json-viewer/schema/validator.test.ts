/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { inferSchema } from './inference';
import { matches, matchesType, validate } from './validator';

describe('Schema Validation', () => {
  describe('validate', () => {
    it('should validate correct data', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      const result = validate({ name: 'Jane', age: 25 }, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect type mismatches', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      const result = validate({ name: 'Jane', age: 'invalid' }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toEqual(['age']);
      expect(result.errors[0].rule).toBe('type');
      expect(result.errors[0].expected).toBe('number');
      expect(result.errors[0].actual).toBe('string');
    });

    it('should detect missing required properties', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      const result = validate({ name: 'Jane' }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.join('.') === 'age')).toBe(true);
      expect(result.errors.some((e) => e.rule === 'required')).toBe(true);
    });

    it('should validate nested objects', () => {
      const schema = inferSchema({
        user: {
          name: 'John',
          age: 30,
        },
      });

      const result = validate(
        {
          user: {
            name: 'Jane',
            age: 'invalid',
          },
        },
        schema,
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toEqual(['user', 'age']);
    });

    it('should validate arrays', () => {
      const schema = inferSchema({ tags: ['a', 'b', 'c'] });
      const result = validate({ tags: [1, 2, 3] }, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].rule).toBe('type');
    });

    it('should validate string constraints', () => {
      const schema = inferSchema('test');
      if (schema.root.type === 'string') {
        schema.root.minLength = 5;
        schema.root.maxLength = 10;
      }

      expect(validate('abc', schema).valid).toBe(false); // too short
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate('this is too long', schema).valid).toBe(false); // too long
    });

    it('should validate number constraints', () => {
      const schema = inferSchema(50);
      if (schema.root.type === 'number') {
        schema.root.minimum = 10;
        schema.root.maximum = 100;
      }

      expect(validate(5, schema).valid).toBe(false); // too small
      expect(validate(50, schema).valid).toBe(true);
      expect(validate(150, schema).valid).toBe(false); // too large
    });

    it('should validate email format', () => {
      const schema = inferSchema('test@example.com', { inferFormats: true });

      expect(validate('valid@example.com', schema).valid).toBe(true);
      expect(validate('invalid-email', schema).valid).toBe(false);
    });

    it('should validate date format', () => {
      const schema = inferSchema('2024-01-15', { inferFormats: true });

      expect(validate('2024-12-25', schema).valid).toBe(true);
      expect(validate('not-a-date', schema).valid).toBe(false);
    });

    it('should validate UUID format', () => {
      const schema = inferSchema('123e4567-e89b-12d3-a456-426614174000', {
        inferFormats: true,
      });

      expect(
        validate('987e6543-e21c-43d1-b234-567890123456', schema).valid,
      ).toBe(true);
      expect(validate('not-a-uuid', schema).valid).toBe(false);
    });

    it('should handle nullable values', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      if (schema.root.type === 'object') {
        schema.root.properties.age.nullable = true;
      }

      const result = validate({ name: 'Jane', age: null }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate array item schemas', () => {
      const schema = inferSchema({
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      });

      const validData = {
        users: [
          { name: 'Bob', age: 35 },
          { name: 'Alice', age: 28 },
        ],
      };

      const invalidData = {
        users: [
          { name: 'Bob', age: 'invalid' },
          { name: 'Alice', age: 28 },
        ],
      };

      expect(validate(validData, schema).valid).toBe(true);
      expect(validate(invalidData, schema).valid).toBe(false);
    });

    it('should provide detailed error messages', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      const result = validate({ name: 123, age: 'invalid' }, schema);

      expect(result.errors).toHaveLength(2);

      const nameError = result.errors.find((e) => e.path.join('.') === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('Type mismatch');

      const ageError = result.errors.find((e) => e.path.join('.') === 'age');
      expect(ageError).toBeDefined();
      expect(ageError?.message).toContain('Type mismatch');
    });
  });

  describe('matches', () => {
    it('should return true for matching values', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      expect(matches({ name: 'Jane', age: 25 }, schema.root)).toBe(true);
    });

    it('should return false for non-matching values', () => {
      const schema = inferSchema({ name: 'John', age: 30 });
      expect(matches({ name: 'Jane', age: 'invalid' }, schema.root)).toBe(
        false,
      );
    });
  });

  describe('matchesType', () => {
    it('should check only type, not constraints', () => {
      const schema = inferSchema('test');
      if (schema.root.type === 'string') {
        schema.root.minLength = 10; // constraint that would fail
      }

      expect(matchesType('hi', schema.root)).toBe(true); // Type matches even though it's too short
    });

    it('should handle nullable types', () => {
      const schema = inferSchema('test');
      schema.root.nullable = true;

      expect(matchesType(null, schema.root)).toBe(true);
    });
  });
});
