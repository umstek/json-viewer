import { useMemo } from 'react';
import type { JSONSchemaObject, JSONSchemaValidationOptions } from '../schema/json-schema';
import { validateWithJSONSchema } from '../schema/json-schema';
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
  return useMemo(() => {
    if (!jsonSchema || data === null) {
      return null;
    }

    return validateWithJSONSchema(data, jsonSchema, options);
  }, [data, jsonSchema, options]);
}
