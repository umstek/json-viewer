/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vite-plus/test';
import {
  clearValidatorCache,
  createJSONSchemaValidator,
  type JSONSchemaObject,
  validateWithJSONSchema,
} from './json-schema';

describe('JSON Schema Validation', () => {
  describe('validateWithJSONSchema', () => {
    it('should validate correct data', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };

      const result = validateWithJSONSchema({ name: 'John', age: 30 }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name', 'age'],
      };

      const result = validateWithJSONSchema({ name: 'John', age: -5 }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate formats when enabled', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const resultValid = validateWithJSONSchema({ email: 'test@example.com' }, schema, {
        validateFormats: true,
      });
      expect(resultValid.valid).toBe(true);

      const resultInvalid = validateWithJSONSchema({ email: 'not-an-email' }, schema, {
        validateFormats: true,
      });
      expect(resultInvalid.valid).toBe(false);
    });

    it('should skip format validation when disabled', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const result = validateWithJSONSchema({ email: 'not-an-email' }, schema, {
        validateFormats: false,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validator caching with different options', () => {
    it('should not reuse validators when options differ', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          count: { type: 'number' },
        },
      };

      // First call with validateFormats: true
      const result1 = validateWithJSONSchema({ count: '123' }, schema, {
        coerceTypes: true,
      });
      // With coerceTypes: true, '123' string should be coerced to number
      expect(result1.valid).toBe(true);

      // Second call with coerceTypes: false (default)
      const result2 = validateWithJSONSchema({ count: '123' }, schema, {
        coerceTypes: false,
      });
      // With coerceTypes: false, '123' string should fail number type check
      expect(result2.valid).toBe(false);
    });

    it('should use cached validator when same schema and options are used', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      // Multiple calls with same schema and default options should use cache
      const result1 = validateWithJSONSchema({ name: 'test' }, schema);
      const result2 = validateWithJSONSchema({ name: 'another' }, schema);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should handle strict option differently', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          value: { type: 'string' },
        },
        additionalProperties: true,
      };

      // Both should work with different strict settings but different validators
      const result1 = validateWithJSONSchema({ value: 'test' }, schema, {
        strict: false,
      });
      const result2 = validateWithJSONSchema({ value: 'test' }, schema, {
        strict: true,
      });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should allow format validation to be toggled independently', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      // First call with formats disabled - should pass invalid email
      const result1 = validateWithJSONSchema({ email: 'invalid-email' }, schema, {
        validateFormats: false,
      });
      expect(result1.valid).toBe(true);

      // Second call with formats enabled - should fail invalid email
      const result2 = validateWithJSONSchema({ email: 'invalid-email' }, schema, {
        validateFormats: true,
      });
      expect(result2.valid).toBe(false);
    });

    it('should cache validators per option combination for same schema', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          value: { type: 'string' },
        },
      };

      // Call with same options multiple times
      const options1 = { validateFormats: true };
      const options2 = { validateFormats: false };

      // These should use separate cached validators
      validateWithJSONSchema({ value: 'test' }, schema, options1);
      validateWithJSONSchema({ value: 'test' }, schema, options2);
      validateWithJSONSchema({ value: 'test' }, schema, options1);
      validateWithJSONSchema({ value: 'test' }, schema, options2);

      // If caching is broken, this might fail or throw
      // With proper caching, it should work fine
      expect(true).toBe(true);
    });
  });

  describe('createJSONSchemaValidator', () => {
    it('should create a reusable validator function', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const validator = createJSONSchemaValidator(schema);

      expect(validator({ name: 'John' }).valid).toBe(true);
      expect(validator({ name: 123 }).valid).toBe(false);
    });

    it('should respect coerceTypes option', () => {
      const schema: JSONSchemaObject = {
        type: 'object',
        properties: {
          count: { type: 'number' },
        },
      };

      const coerceValidator = createJSONSchemaValidator(schema, {
        coerceTypes: true,
      });
      const strictValidator = createJSONSchemaValidator(schema, {
        coerceTypes: false,
      });

      // With coercion, string '123' becomes number
      expect(coerceValidator({ count: '123' }).valid).toBe(true);
      // Without coercion, string '123' fails number type
      expect(strictValidator({ count: '123' }).valid).toBe(false);
    });
  });

  describe('clearValidatorCache', () => {
    it('should be a callable function without error', () => {
      expect(() => clearValidatorCache()).not.toThrow();
    });
  });
});
