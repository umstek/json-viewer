/**
 * Schema infrastructure for JSON data
 *
 * This module provides a comprehensive schema system for JSON data including:
 * - Type definitions for schemas
 * - Schema inference from sample data
 * - Validation of data against schemas
 *
 * @example Basic usage
 * ```typescript
 * import { inferSchema, validate } from './schema';
 *
 * // Infer schema from data
 * const data = { name: "John", age: 30, tags: ["dev", "ts"] };
 * const schema = inferSchema(data);
 *
 * // Validate other data against the schema
 * const result = validate({ name: "Jane", age: "invalid" }, schema);
 * if (!result.valid) {
 *   console.log(result.errors);
 * }
 * ```
 *
 * @example Schema from multiple samples
 * ```typescript
 * import { inferSchemaFromSamples } from './schema';
 *
 * const samples = [
 *   { name: "John", age: 30, city: "NYC" },
 *   { name: "Jane", age: 25, country: "USA" }
 * ];
 * const schema = inferSchemaFromSamples(samples);
 * // Schema will include all properties: name, age, city, country
 * ```
 *
 * @module schema
 */

// Inference functions
export {
  getJsonType,
  inferSchema,
  inferSchemaFromSamples,
} from './inference';
// JSON Schema support
export type {
  JSONSchemaObject,
  JSONSchemaValidationOptions,
} from './json-schema';
export {
  clearValidatorCache,
  convertJSONSchemaToSchema,
  createJSONSchemaValidator,
  validateWithJSONSchema,
} from './json-schema';
// Type definitions
export type {
  ArraySchemaNode,
  BaseSchemaNode,
  BooleanSchemaNode,
  InferenceOptions,
  JsonComplexType,
  JsonPrimitiveType,
  JsonType,
  NullSchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  Schema,
  SchemaNode,
  StringSchemaNode,
  ValidationError,
  ValidationResult,
} from './types';
// Validation functions
export { matches, matchesType, validate } from './validator';
