/**
 * Schema inference from JSON data
 *
 * This module provides functionality to automatically generate schemas from
 * sample JSON data by analyzing types, structures, and patterns.
 */

import { detectFormat } from '../validation';
import type {
  ArraySchemaNode,
  InferenceOptions,
  ObjectSchemaNode,
  Schema,
  SchemaNode,
} from './types';

/**
 * Default options for schema inference
 */
const DEFAULT_OPTIONS: Required<InferenceOptions> = {
  strictRequired: true,
  inferFormats: true,
  includeExamples: false,
  maxExamples: 3,
  inferEnums: false,
  enumThreshold: 3,
};

/**
 * Infers a schema from sample JSON data
 *
 * @param data - The JSON data to analyze
 * @param options - Inference options
 * @returns A complete schema structure
 *
 * @example
 * const schema = inferSchema({
 *   name: "John Doe",
 *   age: 30,
 *   email: "john@example.com",
 *   tags: ["developer", "typescript"]
 * });
 */
export function inferSchema(
  data: unknown,
  options: InferenceOptions = {},
): Schema {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    $schema: 'json-viewer-schema-v1',
    root: inferSchemaNode(data, opts),
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'inferred',
      sampleCount: 1,
    },
  };
}

/**
 * Infers a schema from multiple samples
 * Merges schemas from all samples to create a more comprehensive schema
 *
 * @param samples - Array of sample data
 * @param options - Inference options
 * @returns A complete schema structure
 *
 * @example
 * const schema = inferSchemaFromSamples([
 *   { name: "John", age: 30, city: "NYC" },
 *   { name: "Jane", age: 25, country: "USA" }
 * ]);
 */
export function inferSchemaFromSamples(
  samples: unknown[],
  options: InferenceOptions = {},
): Schema {
  if (samples.length === 0) {
    throw new Error('At least one sample is required for schema inference');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const schemas = samples.map((sample) => inferSchemaNode(sample, opts));

  // Merge all schemas
  const mergedRoot = mergeSchemaNodes(schemas);

  return {
    $schema: 'json-viewer-schema-v1',
    root: mergedRoot,
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'inferred',
      sampleCount: samples.length,
    },
  };
}

/**
 * Infers a schema node from a value
 */
function inferSchemaNode(
  value: unknown,
  options: Required<InferenceOptions>,
): SchemaNode {
  // Handle null
  if (value === null) {
    return { type: 'null' };
  }

  // Handle primitives
  if (typeof value === 'string') {
    return inferStringSchema(value, options);
  }

  if (typeof value === 'number') {
    return inferNumberSchema(value, options);
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return inferArraySchema(value, options);
  }

  // Handle objects
  if (typeof value === 'object') {
    return inferObjectSchema(value as Record<string, unknown>, options);
  }

  // Fallback to string for unknown types
  return { type: 'string' };
}

/**
 * Infers a string schema with format detection
 */
function inferStringSchema(
  value: string,
  options: Required<InferenceOptions>,
): SchemaNode {
  const node: SchemaNode = {
    type: 'string',
  };

  if (options.inferFormats) {
    const format = detectStringFormat(value);
    if (format) {
      (node as { format?: string }).format = format;
    }
  }

  if (options.includeExamples) {
    node.examples = [value];
  }

  return node;
}

/**
 * Infers a number schema
 */
function inferNumberSchema(
  value: number,
  options: Required<InferenceOptions>,
): SchemaNode {
  const node: SchemaNode = {
    type: 'number',
  };

  if (options.includeExamples) {
    node.examples = [value];
  }

  return node;
}

/**
 * Infers an array schema
 */
function inferArraySchema(
  value: unknown[],
  options: Required<InferenceOptions>,
): ArraySchemaNode {
  const node: ArraySchemaNode = {
    type: 'array',
  };

  // If array is not empty, infer item schema
  if (value.length > 0) {
    // Get schemas for all items
    const itemSchemas = value.map((item) => inferSchemaNode(item, options));

    // Merge all item schemas to handle heterogeneous arrays
    node.items = mergeSchemaNodes(itemSchemas);
  }

  return node;
}

/**
 * Infers an object schema
 */
function inferObjectSchema(
  value: Record<string, unknown>,
  options: Required<InferenceOptions>,
): ObjectSchemaNode {
  const properties: Record<string, SchemaNode> = {};
  const required: string[] = [];

  // Infer schema for each property
  for (const [key, val] of Object.entries(value)) {
    properties[key] = inferSchemaNode(val, options);

    if (options.strictRequired && val !== undefined) {
      required.push(key);
    }
  }

  const node: ObjectSchemaNode = {
    type: 'object',
    properties,
  };

  if (required.length > 0) {
    node.required = required;
  }

  return node;
}

/**
 * Merges multiple schema nodes into a single schema
 * Useful for handling multiple samples or heterogeneous arrays
 */
function mergeSchemaNodes(nodes: SchemaNode[]): SchemaNode {
  if (nodes.length === 0) {
    return { type: 'null' };
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  // Group nodes by type
  const typeGroups = new Map<string, SchemaNode[]>();
  for (const node of nodes) {
    const key = node.type;
    if (!typeGroups.has(key)) {
      typeGroups.set(key, []);
    }
    typeGroups.get(key)?.push(node);
  }

  // If all nodes have the same type, merge them
  if (typeGroups.size === 1) {
    const [type, sameTypeNodes] = Array.from(typeGroups.entries())[0];

    switch (type) {
      case 'object':
        return mergeObjectSchemas(sameTypeNodes as ObjectSchemaNode[]);
      case 'array':
        return mergeArraySchemas(sameTypeNodes as ArraySchemaNode[]);
      default:
        // For primitives, just return the first one
        return sameTypeNodes[0];
    }
  }

  // If types differ, check if we can make one nullable
  // For simplicity, return the first non-null type and mark as nullable
  const nonNullNodes = nodes.filter((n) => n.type !== 'null');
  if (nonNullNodes.length > 0) {
    const result = { ...nonNullNodes[0] };
    result.nullable = true;
    return result;
  }

  return nodes[0];
}

/**
 * Merges multiple object schemas
 */
function mergeObjectSchemas(nodes: ObjectSchemaNode[]): ObjectSchemaNode {
  const allProperties = new Map<string, SchemaNode[]>();
  const requiredSets: Set<string>[] = [];

  // Collect all properties and required fields
  for (const node of nodes) {
    for (const [key, schema] of Object.entries(node.properties)) {
      if (!allProperties.has(key)) {
        allProperties.set(key, []);
      }
      allProperties.get(key)?.push(schema);
    }

    if (node.required) {
      requiredSets.push(new Set(node.required));
    }
  }

  // Merge properties
  const mergedProperties: Record<string, SchemaNode> = {};
  for (const [key, schemas] of allProperties.entries()) {
    mergedProperties[key] = mergeSchemaNodes(schemas);
  }

  // Find properties that are required in all samples
  const required: string[] = [];
  for (const key of allProperties.keys()) {
    const isRequiredInAll = requiredSets.every((set) => set.has(key));
    if (isRequiredInAll && requiredSets.length === nodes.length) {
      required.push(key);
    }
  }

  const result: ObjectSchemaNode = {
    type: 'object',
    properties: mergedProperties,
  };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

/**
 * Merges multiple array schemas
 */
function mergeArraySchemas(nodes: ArraySchemaNode[]): ArraySchemaNode {
  const itemSchemas: SchemaNode[] = [];

  for (const node of nodes) {
    if (node.items) {
      itemSchemas.push(node.items);
    }
  }

  const result: ArraySchemaNode = {
    type: 'array',
  };

  if (itemSchemas.length > 0) {
    result.items = mergeSchemaNodes(itemSchemas);
  }

  return result;
}

/**
 * Detects string format based on patterns using Zod-based validation
 *
 * This function uses the new validation system with confidence scoring,
 * but maintains backward compatibility by returning a single format string.
 *
 * @param value - The string value to analyze
 * @returns The detected format, or undefined if no format matches
 */
function detectStringFormat(value: string): string | undefined {
  // Use the new Zod-based validation system with confidence scoring
  // Only return a format if confidence is >= 0.5 (medium-high confidence)
  const result = detectFormat(value, 0.5);

  if (!result) {
    return undefined;
  }

  // Map validation formats to schema formats for backward compatibility
  // Most formats map directly, but 'url' maps to 'uri' for JSON Schema compatibility
  switch (result.format) {
    case 'url':
      return 'uri';
    default:
      return result.format;
  }
}

/**
 * Gets the JSON type of a value
 */
export function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
