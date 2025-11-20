/**
 * JSON Schema standard validation support
 *
 * This module provides support for standard JSON Schema (Draft 7 and later) validation:
 * - Imports standard JSON Schema definitions
 * - Validates JSON data against JSON Schema using ajv
 * - Converts JSON Schema to internal schema format
 * - Maps ajv validation errors to our ValidationError format
 */

import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type {
  ArraySchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  Schema,
  SchemaNode,
  StringSchemaNode,
  ValidationError,
  ValidationResult,
} from './types';

/**
 * JSON Schema type definition (simplified)
 * Supports JSON Schema Draft 7 and later
 */
export interface JSONSchemaObject {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'null'
    | 'object'
    | 'array'
    | (
        | 'string'
        | 'number'
        | 'integer'
        | 'boolean'
        | 'null'
        | 'object'
        | 'array'
      )[];
  properties?: Record<string, JSONSchemaObject>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaObject;
  items?: JSONSchemaObject | JSONSchemaObject[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  nullable?: boolean;
  const?: unknown;
  allOf?: JSONSchemaObject[];
  anyOf?: JSONSchemaObject[];
  oneOf?: JSONSchemaObject[];
  not?: JSONSchemaObject;
  definitions?: Record<string, JSONSchemaObject>;
  $defs?: Record<string, JSONSchemaObject>;
  $ref?: string;
  [key: string]: unknown;
}

/**
 * Options for JSON Schema validation
 */
export interface JSONSchemaValidationOptions {
  /**
   * Whether to validate formats (date, email, uri, etc.)
   * Default: true
   */
  validateFormats?: boolean;

  /**
   * Whether to allow additional properties not defined in schema
   * Default: true
   */
  allowAdditionalProperties?: boolean;

  /**
   * Whether to coerce types (e.g., "123" to 123)
   * Default: false
   */
  coerceTypes?: boolean;

  /**
   * Whether to remove additional properties during validation
   * Default: false
   */
  removeAdditional?: boolean | 'all' | 'failing';

  /**
   * Whether to use defaults from schema
   * Default: false
   */
  useDefaults?: boolean;

  /**
   * Strict mode for schema validation
   * Default: false
   */
  strict?: boolean;
}

/**
 * JSON Schema validator instance cache
 */
const validatorCache = new WeakMap<JSONSchemaObject, ValidateFunction>();

/**
 * Creates an Ajv instance with the given options
 */
function createAjv(options: JSONSchemaValidationOptions = {}): Ajv {
  const ajv = new Ajv({
    allErrors: true, // Collect all errors, not just first
    verbose: true, // Include schema and data in errors
    strict: options.strict ?? false,
    validateFormats: options.validateFormats ?? true,
    coerceTypes: options.coerceTypes ?? false,
    removeAdditional: options.removeAdditional ?? false,
    useDefaults: options.useDefaults ?? false,
  });

  // Add format validators (email, uri, date, etc.)
  // @ts-expect-error - ajv-formats has a type mismatch with ajv due to different versions of internal types, but it works at runtime
  addFormats(ajv);

  return ajv;
}

/**
 * Validates data against a JSON Schema
 *
 * @param data - The data to validate
 * @param jsonSchema - The JSON Schema to validate against
 * @param options - Validation options
 * @returns Validation result with errors if any
 *
 * @example
 * const schema: JSONSchemaObject = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', minLength: 1 },
 *     age: { type: 'number', minimum: 0 }
 *   },
 *   required: ['name', 'age']
 * };
 *
 * const result = validateWithJSONSchema({ name: 'John', age: 30 }, schema);
 * console.log(result.valid); // true
 *
 * const result2 = validateWithJSONSchema({ name: '', age: -5 }, schema);
 * console.log(result2.errors); // Array of validation errors
 */
export function validateWithJSONSchema(
  data: unknown,
  jsonSchema: JSONSchemaObject,
  options: JSONSchemaValidationOptions = {},
): ValidationResult {
  // Try to get cached validator
  let validate = validatorCache.get(jsonSchema);

  // Create validator if not cached
  if (!validate) {
    const ajv = createAjv(options);
    validate = ajv.compile(jsonSchema);
    validatorCache.set(jsonSchema, validate);
  }

  // Validate the data
  const valid = validate(data) as boolean;

  // If valid, return early
  if (valid) {
    return {
      valid: true,
      errors: [],
    };
  }

  // Convert ajv errors to our ValidationError format
  const errors: ValidationError[] = (validate.errors || []).map((err) =>
    ajvErrorToValidationError(err),
  );

  return {
    valid: false,
    errors,
  };
}

/**
 * Converts an ajv ErrorObject to our ValidationError format
 */
function ajvErrorToValidationError(error: ErrorObject): ValidationError {
  // Convert JSONPath to array (e.g., "/users/0/name" to ["users", "0", "name"])
  const path = error.instancePath
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => decodeURIComponent(segment));

  // Build error message
  let message = error.message || 'Validation failed';
  const keyword = error.keyword;

  // Add more context based on error type
  if (error.params) {
    switch (keyword) {
      case 'required':
        message = `Required property "${error.params.missingProperty}" is missing`;
        break;
      case 'type':
        message = `Type mismatch: expected ${error.params.type}, got ${typeof error.data}`;
        break;
      case 'minimum':
        message = `Value ${error.data} is less than minimum ${error.params.limit}`;
        break;
      case 'maximum':
        message = `Value ${error.data} is greater than maximum ${error.params.limit}`;
        break;
      case 'minLength':
        message = `String length ${(error.data as string)?.length || 0} is less than minimum ${error.params.limit}`;
        break;
      case 'maxLength':
        message = `String length ${(error.data as string)?.length || 0} is greater than maximum ${error.params.limit}`;
        break;
      case 'pattern':
        message = `String does not match pattern ${error.params.pattern}`;
        break;
      case 'format':
        message = `String does not match format "${error.params.format}"`;
        break;
      case 'enum':
        message = `Value is not in allowed values: ${JSON.stringify(error.params.allowedValues)}`;
        break;
      case 'minItems':
        message = `Array length ${(error.data as unknown[])?.length || 0} is less than minimum ${error.params.limit}`;
        break;
      case 'maxItems':
        message = `Array length ${(error.data as unknown[])?.length || 0} is greater than maximum ${error.params.limit}`;
        break;
      case 'additionalProperties':
        message = `Additional property "${error.params.additionalProperty}" is not allowed`;
        break;
      case 'multipleOf':
        message = `Number ${error.data} is not a multiple of ${error.params.multipleOf}`;
        break;
    }
  }

  return {
    path,
    message,
    expected: error.schema as string | undefined,
    actual: String(error.data),
    rule: keyword,
  };
}

/**
 * Converts a JSON Schema to our internal Schema format
 *
 * This allows you to use JSON Schema for validation while still
 * benefiting from our schema inference and type system.
 *
 * @param jsonSchema - The JSON Schema to convert
 * @returns Internal Schema object
 *
 * @example
 * const jsonSchema: JSONSchemaObject = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   }
 * };
 *
 * const internalSchema = convertJSONSchemaToSchema(jsonSchema);
 * // Now you can use internalSchema with our existing validator
 */
export function convertJSONSchemaToSchema(
  jsonSchema: JSONSchemaObject,
): Schema {
  return {
    $schema: jsonSchema.$schema,
    title: jsonSchema.title,
    description: jsonSchema.description,
    root: convertJSONSchemaNodeToSchemaNode(jsonSchema),
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'imported',
    },
  };
}

/**
 * Converts a JSON Schema node to our internal SchemaNode format
 */
function convertJSONSchemaNodeToSchemaNode(
  jsonSchema: JSONSchemaObject,
): SchemaNode {
  // Handle type array (e.g., ["string", "null"])
  let type = jsonSchema.type;
  let nullable = jsonSchema.nullable ?? false;

  if (Array.isArray(type)) {
    // If type is an array, extract the non-null type and set nullable if null is present
    nullable = type.includes('null');
    const nonNullTypes = type.filter((t) => t !== 'null');
    type = nonNullTypes[0]; // Take the first non-null type
  }

  // Handle integer as number
  if (type === 'integer') {
    type = 'number';
  }

  // Default to object if no type specified
  if (!type) {
    type = 'object';
  }

  const baseNode = {
    type: type as 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array',
    description: jsonSchema.description,
    nullable,
  };

  switch (type) {
    case 'string': {
      const stringNode: StringSchemaNode = {
        ...baseNode,
        type: 'string',
        minLength: jsonSchema.minLength,
        maxLength: jsonSchema.maxLength,
        pattern: jsonSchema.pattern,
        format: jsonSchema.format,
      };

      // Handle enum for strings
      if (jsonSchema.enum?.every((v) => typeof v === 'string')) {
        stringNode.enum = jsonSchema.enum as string[];
      }

      return stringNode;
    }

    case 'number': {
      const numberNode: NumberSchemaNode = {
        ...baseNode,
        type: 'number',
        minimum:
          jsonSchema.minimum ??
          (typeof jsonSchema.exclusiveMinimum === 'number'
            ? jsonSchema.exclusiveMinimum
            : undefined),
        maximum:
          jsonSchema.maximum ??
          (typeof jsonSchema.exclusiveMaximum === 'number'
            ? jsonSchema.exclusiveMaximum
            : undefined),
        multipleOf: jsonSchema.multipleOf,
      };

      // Handle enum for numbers
      if (jsonSchema.enum?.every((v) => typeof v === 'number')) {
        numberNode.enum = jsonSchema.enum as number[];
      }

      return numberNode;
    }

    case 'boolean':
      return {
        ...baseNode,
        type: 'boolean',
      };

    case 'null':
      return {
        ...baseNode,
        type: 'null',
      };

    case 'object': {
      const properties: Record<string, SchemaNode> = {};

      // Convert properties
      if (jsonSchema.properties) {
        for (const [key, propSchema] of Object.entries(jsonSchema.properties)) {
          properties[key] = convertJSONSchemaNodeToSchemaNode(propSchema);
        }
      }

      const objectNode: ObjectSchemaNode = {
        ...baseNode,
        type: 'object',
        properties,
        required: jsonSchema.required,
        minProperties: jsonSchema.minProperties,
        maxProperties: jsonSchema.maxProperties,
      };

      // Handle additionalProperties
      if (jsonSchema.additionalProperties !== undefined) {
        if (typeof jsonSchema.additionalProperties === 'boolean') {
          objectNode.additionalProperties = jsonSchema.additionalProperties;
        } else {
          objectNode.additionalProperties = convertJSONSchemaNodeToSchemaNode(
            jsonSchema.additionalProperties,
          );
        }
      }

      return objectNode;
    }

    case 'array': {
      const arrayNode: ArraySchemaNode = {
        ...baseNode,
        type: 'array',
        minItems: jsonSchema.minItems,
        maxItems: jsonSchema.maxItems,
        uniqueItems: jsonSchema.uniqueItems,
      };

      // Handle items schema
      if (jsonSchema.items) {
        if (!Array.isArray(jsonSchema.items)) {
          arrayNode.items = convertJSONSchemaNodeToSchemaNode(jsonSchema.items);
        } else if (jsonSchema.items.length > 0) {
          // For tuple validation, use the first schema (simplified)
          arrayNode.items = convertJSONSchemaNodeToSchemaNode(
            jsonSchema.items[0],
          );
        }
      }

      return arrayNode;
    }

    default:
      // Fallback to string for unknown types
      return {
        type: 'string',
        description: baseNode.description,
        nullable: baseNode.nullable,
      };
  }
}

/**
 * Creates a JSON Schema validator function that can be reused
 *
 * @param jsonSchema - The JSON Schema to create validator for
 * @param options - Validation options
 * @returns A validator function that takes data and returns ValidationResult
 *
 * @example
 * const schema: JSONSchemaObject = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' }
 *   }
 * };
 *
 * const validator = createJSONSchemaValidator(schema);
 *
 * // Reuse the validator multiple times
 * const result1 = validator({ name: 'John' });
 * const result2 = validator({ name: 123 }); // Type error
 */
export function createJSONSchemaValidator(
  jsonSchema: JSONSchemaObject,
  options: JSONSchemaValidationOptions = {},
): (data: unknown) => ValidationResult {
  // Pre-compile the validator
  const ajv = createAjv(options);
  const validate = ajv.compile(jsonSchema);

  // Cache it
  validatorCache.set(jsonSchema, validate);

  // Return a function that validates data
  return (data: unknown): ValidationResult => {
    const valid = validate(data) as boolean;

    if (valid) {
      return {
        valid: true,
        errors: [],
      };
    }

    const errors: ValidationError[] = (validate.errors || []).map((err) =>
      ajvErrorToValidationError(err),
    );

    return {
      valid: false,
      errors,
    };
  };
}

/**
 * Clears the validator cache
 * Useful when you want to free up memory or reset validation state
 */
export function clearValidatorCache(): void {
  // WeakMap doesn't have a clear method, but we can't access it anyway
  // This function is here for API completeness and future implementation
}
