import { useMemo } from 'react';
import type { JSONSchemaObject, JSONSchemaValidationOptions } from '../schema/json-schema';
import { validateWithJSONSchema } from '../schema/json-schema';
import type { ValidationResult } from '../schema/types';

/**
 * Serializes validation options into a stable string key
 *
 * Mirrors hashOptions in ../schema/json-schema (same fields, same defaults) so
 * the memo below can depend on the serialized options instead of the options
 * object identity, which changes on every render for inline literals. Keep
 * both in sync.
 */
function hashValidationOptions(options?: JSONSchemaValidationOptions): string {
  const relevant: Record<string, unknown> = {
    strict: options?.strict ?? false,
    validateFormats: options?.validateFormats ?? true,
    coerceTypes: options?.coerceTypes ?? false,
    removeAdditional: options?.removeAdditional ?? false,
    useDefaults: options?.useDefaults ?? false,
  };
  return JSON.stringify(relevant);
}

/**
 * Custom hook to validate JSON data against a JSON Schema.
 * Returns the validation result.
 */
export function useSchemaValidation(
  data: unknown,
  jsonSchema?: JSONSchemaObject,
  options?: JSONSchemaValidationOptions,
): ValidationResult | null {
  // Inline options objects are recreated on every render, so depend on their
  // serialized form rather than object identity to keep the memo stable.
  const optionsKey = hashValidationOptions(options);

  return useMemo(() => {
    if (!jsonSchema || data === null) {
      return null;
    }

    // The serialized options fully determine validation behavior, so the
    // canonical object rebuilt here is equivalent to the caller's options.
    const canonicalOptions = JSON.parse(optionsKey) as JSONSchemaValidationOptions;
    return validateWithJSONSchema(data, jsonSchema, canonicalOptions);
  }, [data, jsonSchema, optionsKey]);
}
