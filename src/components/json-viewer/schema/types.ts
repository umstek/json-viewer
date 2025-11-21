/**
 * Schema type definitions for JSON data validation and type inference
 *
 * This module provides a lightweight schema system that supports basic JSON Schema
 * concepts including types, properties, required fields, and nested structures.
 */

/**
 * Supported JSON primitive types
 */
export type JsonPrimitiveType = 'string' | 'number' | 'boolean' | 'null';

/**
 * Supported JSON complex types
 */
export type JsonComplexType = 'object' | 'array';

/**
 * All supported JSON types
 */
export type JsonType = JsonPrimitiveType | JsonComplexType;

/**
 * Base schema node containing common properties
 */
export interface BaseSchemaNode {
  /**
   * The JSON type this schema node represents
   */
  type: JsonType;

  /**
   * Human-readable description of this schema node
   */
  description?: string;

  /**
   * Whether this field is nullable (can be null)
   */
  nullable?: boolean;

  /**
   * Example value(s) for this schema node
   */
  examples?: unknown[];
}

/**
 * Schema node for string types
 */
export interface StringSchemaNode extends BaseSchemaNode {
  type: 'string';

  /**
   * Minimum string length
   */
  minLength?: number;

  /**
   * Maximum string length
   */
  maxLength?: number;

  /**
   * Pattern (regex) the string must match
   */
  pattern?: string;

  /**
   * Enumerated allowed values
   */
  enum?: string[];

  /**
   * Format hint (e.g., 'date', 'email', 'uri', 'uuid')
   */
  format?: string;
}

/**
 * Schema node for number types
 */
export interface NumberSchemaNode extends BaseSchemaNode {
  type: 'number';

  /**
   * Minimum value (inclusive)
   */
  minimum?: number;

  /**
   * Maximum value (inclusive)
   */
  maximum?: number;

  /**
   * Number must be a multiple of this value
   */
  multipleOf?: number;

  /**
   * Enumerated allowed values
   */
  enum?: number[];
}

/**
 * Schema node for boolean types
 */
export interface BooleanSchemaNode extends BaseSchemaNode {
  type: 'boolean';
}

/**
 * Schema node for null types
 */
export interface NullSchemaNode extends BaseSchemaNode {
  type: 'null';
}

/**
 * Schema node for object types
 */
export interface ObjectSchemaNode extends BaseSchemaNode {
  type: 'object';

  /**
   * Schema definitions for object properties
   */
  properties: Record<string, SchemaNode>;

  /**
   * List of required property names
   */
  required?: string[];

  /**
   * Schema for additional properties not defined in properties
   */
  additionalProperties?: SchemaNode | boolean;

  /**
   * Minimum number of properties
   */
  minProperties?: number;

  /**
   * Maximum number of properties
   */
  maxProperties?: number;
}

/**
 * Schema node for array types
 */
export interface ArraySchemaNode extends BaseSchemaNode {
  type: 'array';

  /**
   * Schema for array items (uniform type)
   */
  items?: SchemaNode;

  /**
   * Minimum array length
   */
  minItems?: number;

  /**
   * Maximum array length
   */
  maxItems?: number;

  /**
   * Whether array items must be unique
   */
  uniqueItems?: boolean;
}

/**
 * Union type representing any schema node
 */
export type SchemaNode =
  | StringSchemaNode
  | NumberSchemaNode
  | BooleanSchemaNode
  | NullSchemaNode
  | ObjectSchemaNode
  | ArraySchemaNode;

/**
 * Root schema structure
 */
export interface Schema {
  /**
   * Schema version (for future compatibility)
   */
  $schema?: string;

  /**
   * Schema title
   */
  title?: string;

  /**
   * Schema description
   */
  description?: string;

  /**
   * Root schema node
   */
  root: SchemaNode;

  /**
   * Metadata about the schema
   */
  metadata?: {
    /**
     * When the schema was created or inferred
     */
    createdAt?: string;

    /**
     * How the schema was created
     */
    source?: 'inferred' | 'manual' | 'imported';

    /**
     * Number of samples used for inference (if applicable)
     */
    sampleCount?: number;
  };
}

/**
 * Validation error for a specific path in the data
 */
export interface ValidationError {
  /**
   * Path to the invalid value (JSONPath format)
   */
  path: string[];

  /**
   * Error message
   */
  message: string;

  /**
   * Expected type or value
   */
  expected?: string;

  /**
   * Actual type or value
   */
  actual?: string;

  /**
   * Validation rule that was violated
   */
  rule?: string;
}

/**
 * Result of schema validation
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;

  /**
   * List of validation errors (empty if valid)
   */
  errors: ValidationError[];
}

/**
 * Options for schema inference
 */
export interface InferenceOptions {
  /**
   * Whether to mark all properties as required
   * Default: true
   */
  strictRequired?: boolean;

  /**
   * Whether to infer string formats (date, email, url, etc.)
   * Default: true
   */
  inferFormats?: boolean;

  /**
   * Whether to generate examples from sample data
   * Default: false
   */
  includeExamples?: boolean;

  /**
   * Maximum number of examples to include per node
   * Default: 3
   */
  maxExamples?: number;

  /**
   * Whether to infer enums from repeated values
   * Default: false
   */
  inferEnums?: boolean;

  /**
   * Minimum number of occurrences to infer an enum
   * Default: 3
   */
  enumThreshold?: number;
}
