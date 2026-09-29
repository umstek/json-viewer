import { useMemo } from 'react';
import type { JSONSchemaObject, JSONSchemaValidationOptions } from '../schema/json-schema';
import { hashOptions, validateWithJSONSchema } from '../schema/json-schema';
import type { ValidationResult } from '../schema/types';

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
  const optionsKey = hashOptions(options);

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
