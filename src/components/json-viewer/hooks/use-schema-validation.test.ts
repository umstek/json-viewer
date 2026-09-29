import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import type { JSONSchemaObject } from '../schema/json-schema';
import { useSchemaValidation } from './use-schema-validation';

describe('useSchemaValidation', () => {
  const schema: JSONSchemaObject = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      age: { type: 'number', minimum: 0 },
    },
    required: ['name', 'age'],
  };

  it('should return null when no schema is provided', () => {
    const { result } = renderHook(() => useSchemaValidation({ name: 'John', age: 30 }));
    expect(result.current).toBeNull();
  });

  it('should validate valid data against schema', () => {
    const { result } = renderHook(() => useSchemaValidation({ name: 'John', age: 30 }, schema));
    expect(result.current).not.toBeNull();
    expect(result.current?.valid).toBe(true);
    expect(result.current?.errors).toEqual([]);
  });

  it('should return validation errors for invalid data', () => {
    const { result } = renderHook(() => useSchemaValidation({ name: '', age: -5 }, schema));
    expect(result.current).not.toBeNull();
    expect(result.current?.valid).toBe(false);
    expect(result.current?.errors.length).toBeGreaterThan(0);
  });

  it('should handle null data', () => {
    const { result } = renderHook(() => useSchemaValidation(null, schema));
    expect(result.current).toBeNull();
  });

  it('should not throw for error paths containing keys with special characters', () => {
    // ajv escapes instancePath with RFC 6901 (~0/~1). Keys with '%' used to
    // hit decodeURIComponent and crash the whole viewer with a URIError.
    const specialKeysSchema: JSONSchemaObject = {
      type: 'object',
      properties: {
        'discount%': { type: 'number' },
        'a/b': { type: 'number' },
        't~x': { type: 'number' },
      },
      additionalProperties: false,
    };

    const { result } = renderHook(() =>
      useSchemaValidation({ 'discount%': 'not a number' }, specialKeysSchema),
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.valid).toBe(false);
    // The error path must decode to the actual offending key.
    expect(result.current?.errors[0]?.path).toContain('discount%');
  });
});
