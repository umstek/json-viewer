/**
 * Schema validation functionality
 *
 * This module provides functions to validate JSON data against schemas,
 * checking types, structure, constraints, and generating detailed error messages.
 */

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
 * Validates data against a schema
 *
 * @param data - The data to validate
 * @param schema - The schema to validate against
 * @returns Validation result with errors if any
 *
 * @example
 * const schema = inferSchema({ name: "John", age: 30 });
 * const result = validate({ name: "Jane", age: "invalid" }, schema);
 * if (!result.valid) {
 *   console.log(result.errors);
 * }
 */
export function validate(data: unknown, schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];
  validateNode(data, schema.root, [], errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a value against a schema node
 */
function validateNode(
  value: unknown,
  node: SchemaNode,
  path: string[],
  errors: ValidationError[],
): void {
  // Handle nullable
  if (value === null) {
    if (node.nullable) {
      return; // Valid
    }
    if (node.type === 'null') {
      return; // Valid
    }
    errors.push({
      path,
      message: 'Value is null but schema does not allow null',
      expected: node.type,
      actual: 'null',
      rule: 'type',
    });
    return;
  }

  // Type validation
  const actualType = getValueType(value);
  if (actualType !== node.type) {
    errors.push({
      path,
      message: `Type mismatch: expected ${node.type}, got ${actualType}`,
      expected: node.type,
      actual: actualType,
      rule: 'type',
    });
    return; // Stop further validation if type is wrong
  }

  // Type-specific validation
  switch (node.type) {
    case 'string':
      validateString(value as string, node, path, errors);
      break;
    case 'number':
      validateNumber(value as number, node, path, errors);
      break;
    case 'boolean':
      // Boolean type is already validated
      break;
    case 'null':
      // Null type is already validated
      break;
    case 'object':
      validateObject(value as Record<string, unknown>, node, path, errors);
      break;
    case 'array':
      validateArray(value as unknown[], node, path, errors);
      break;
  }
}

/**
 * Validates a string value
 */
function validateString(
  value: string,
  node: StringSchemaNode,
  path: string[],
  errors: ValidationError[],
): void {
  // Length validation
  if (node.minLength !== undefined && value.length < node.minLength) {
    errors.push({
      path,
      message: `String length ${value.length} is less than minimum ${node.minLength}`,
      expected: `length >= ${node.minLength}`,
      actual: `length = ${value.length}`,
      rule: 'minLength',
    });
  }

  if (node.maxLength !== undefined && value.length > node.maxLength) {
    errors.push({
      path,
      message: `String length ${value.length} is greater than maximum ${node.maxLength}`,
      expected: `length <= ${node.maxLength}`,
      actual: `length = ${value.length}`,
      rule: 'maxLength',
    });
  }

  // Pattern validation
  if (node.pattern) {
    try {
      const regex = new RegExp(node.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern ${node.pattern}`,
          expected: `pattern: ${node.pattern}`,
          actual: value,
          rule: 'pattern',
        });
      }
    } catch (_e) {
      errors.push({
        path,
        message: `Invalid regex pattern: ${node.pattern}`,
        expected: 'valid regex pattern',
        actual: node.pattern,
        rule: 'pattern',
      });
    }
  }

  // Enum validation
  if (node.enum && !node.enum.includes(value)) {
    errors.push({
      path,
      message: `Value "${value}" is not in allowed values`,
      expected: `one of [${node.enum.join(', ')}]`,
      actual: value,
      rule: 'enum',
    });
  }

  // Format validation (basic)
  if (node.format) {
    validateFormat(value, node.format, path, errors);
  }
}

/**
 * Validates a number value
 */
function validateNumber(
  value: number,
  node: NumberSchemaNode,
  path: string[],
  errors: ValidationError[],
): void {
  // Range validation
  if (node.minimum !== undefined && value < node.minimum) {
    errors.push({
      path,
      message: `Number ${value} is less than minimum ${node.minimum}`,
      expected: `>= ${node.minimum}`,
      actual: String(value),
      rule: 'minimum',
    });
  }

  if (node.maximum !== undefined && value > node.maximum) {
    errors.push({
      path,
      message: `Number ${value} is greater than maximum ${node.maximum}`,
      expected: `<= ${node.maximum}`,
      actual: String(value),
      rule: 'maximum',
    });
  }

  // Multiple validation
  if (node.multipleOf !== undefined && value % node.multipleOf !== 0) {
    errors.push({
      path,
      message: `Number ${value} is not a multiple of ${node.multipleOf}`,
      expected: `multiple of ${node.multipleOf}`,
      actual: String(value),
      rule: 'multipleOf',
    });
  }

  // Enum validation
  if (node.enum && !node.enum.includes(value)) {
    errors.push({
      path,
      message: `Value ${value} is not in allowed values`,
      expected: `one of [${node.enum.join(', ')}]`,
      actual: String(value),
      rule: 'enum',
    });
  }
}

/**
 * Validates an object value
 */
function validateObject(
  value: Record<string, unknown>,
  node: ObjectSchemaNode,
  path: string[],
  errors: ValidationError[],
): void {
  // Required properties validation
  if (node.required) {
    for (const requiredKey of node.required) {
      if (!(requiredKey in value)) {
        errors.push({
          path: [...path, requiredKey],
          message: `Required property "${requiredKey}" is missing`,
          expected: 'property to exist',
          actual: 'undefined',
          rule: 'required',
        });
      }
    }
  }

  // Properties validation
  for (const [key, propValue] of Object.entries(value)) {
    const propSchema = node.properties[key];

    if (propSchema) {
      // Validate known properties
      validateNode(propValue, propSchema, [...path, key], errors);
    } else if (node.additionalProperties !== undefined) {
      // Validate additional properties
      if (node.additionalProperties === false) {
        errors.push({
          path: [...path, key],
          message: `Additional property "${key}" is not allowed`,
          expected: 'no additional properties',
          actual: `property "${key}"`,
          rule: 'additionalProperties',
        });
      } else if (typeof node.additionalProperties === 'object') {
        validateNode(
          propValue,
          node.additionalProperties,
          [...path, key],
          errors,
        );
      }
    }
  }

  // Property count validation
  const propertyCount = Object.keys(value).length;

  if (node.minProperties !== undefined && propertyCount < node.minProperties) {
    errors.push({
      path,
      message: `Object has ${propertyCount} properties, minimum is ${node.minProperties}`,
      expected: `>= ${node.minProperties} properties`,
      actual: `${propertyCount} properties`,
      rule: 'minProperties',
    });
  }

  if (node.maxProperties !== undefined && propertyCount > node.maxProperties) {
    errors.push({
      path,
      message: `Object has ${propertyCount} properties, maximum is ${node.maxProperties}`,
      expected: `<= ${node.maxProperties} properties`,
      actual: `${propertyCount} properties`,
      rule: 'maxProperties',
    });
  }
}

/**
 * Validates an array value
 */
function validateArray(
  value: unknown[],
  node: ArraySchemaNode,
  path: string[],
  errors: ValidationError[],
): void {
  // Length validation
  if (node.minItems !== undefined && value.length < node.minItems) {
    errors.push({
      path,
      message: `Array length ${value.length} is less than minimum ${node.minItems}`,
      expected: `>= ${node.minItems} items`,
      actual: `${value.length} items`,
      rule: 'minItems',
    });
  }

  if (node.maxItems !== undefined && value.length > node.maxItems) {
    errors.push({
      path,
      message: `Array length ${value.length} is greater than maximum ${node.maxItems}`,
      expected: `<= ${node.maxItems} items`,
      actual: `${value.length} items`,
      rule: 'maxItems',
    });
  }

  // Items validation
  if (node.items) {
    for (let i = 0; i < value.length; i++) {
      validateNode(value[i], node.items, [...path, String(i)], errors);
    }
  }

  // Unique items validation
  if (node.uniqueItems) {
    const seen = new Set<string>();
    for (let i = 0; i < value.length; i++) {
      const serialized = JSON.stringify(value[i]);
      if (seen.has(serialized)) {
        errors.push({
          path: [...path, String(i)],
          message: 'Array contains duplicate items',
          expected: 'unique items',
          actual: 'duplicate found',
          rule: 'uniqueItems',
        });
        break; // Only report once
      }
      seen.add(serialized);
    }
  }
}

/**
 * Validates an IPv6 address
 * Supports full form, compressed form (::), and loopback (::1)
 */
function isValidIPv6(value: string): boolean {
  // Handle empty string
  if (!value) return false;

  // Split by ::
  const parts = value.split('::');

  // Can have at most one ::
  if (parts.length > 2) return false;

  if (parts.length === 2) {
    // Compressed form
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];

    // Total groups must be <= 8
    if (left.length + right.length > 7) return false;

    // Validate each group
    const allGroups = [...left, ...right];
    return allGroups.every(
      (group) => group === '' || /^[0-9a-f]{1,4}$/i.test(group),
    );
  }

  // Full form - must have exactly 8 groups
  const groups = value.split(':');
  if (groups.length !== 8) return false;

  return groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group));
}

/**
 * Validates string format
 */
function validateFormat(
  value: string,
  format: string,
  path: string[],
  errors: ValidationError[],
): void {
  let isValid = true;
  let pattern = '';

  switch (format) {
    case 'date':
      pattern = 'YYYY-MM-DD';
      isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);
      break;

    case 'date-time':
      pattern = 'ISO 8601 date-time';
      isValid =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(
          value,
        );
      break;

    case 'time':
      pattern = 'HH:MM:SS';
      isValid = /^\d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(value);
      break;

    case 'email':
      pattern = 'valid email address';
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      break;

    case 'uri':
    case 'url':
      pattern = 'valid URL';
      isValid = /^https?:\/\/.+/.test(value);
      break;

    case 'uuid':
      pattern = 'valid UUID';
      isValid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        );
      break;

    case 'ipv4':
      pattern = 'valid IPv4 address';
      isValid = /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
      break;

    case 'ipv6':
      pattern = 'valid IPv6 address';
      isValid = isValidIPv6(value);
      break;

    default:
      // Unknown format, skip validation
      return;
  }

  if (!isValid) {
    errors.push({
      path,
      message: `String does not match format "${format}"`,
      expected: pattern,
      actual: value,
      rule: 'format',
    });
  }
}

/**
 * Gets the JSON type of a value
 */
function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * Checks if a value matches a schema node (quick check without detailed errors)
 *
 * @param value - The value to check
 * @param node - The schema node to check against
 * @returns true if the value matches the schema
 */
export function matches(value: unknown, node: SchemaNode): boolean {
  const errors: ValidationError[] = [];
  validateNode(value, node, [], errors);
  return errors.length === 0;
}

/**
 * Validates only the type of a value (no constraints)
 *
 * @param value - The value to check
 * @param node - The schema node to check against
 * @returns true if the value has the correct type
 */
export function matchesType(value: unknown, node: SchemaNode): boolean {
  if (value === null) {
    return node.type === 'null' || node.nullable === true;
  }

  const actualType = getValueType(value);
  return actualType === node.type;
}
