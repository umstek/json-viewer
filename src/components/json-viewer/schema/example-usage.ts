/**
 * Example usage of the schema infrastructure
 *
 * This file demonstrates the various capabilities of the schema system
 * including inference, validation, and type checking.
 */

import {
  inferSchema,
  inferSchemaFromSamples,
  matches,
  matchesType,
  type Schema,
  validate,
} from './index';

// ============================================================================
// Example 1: Basic Schema Inference
// ============================================================================

const userData = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  isActive: true,
};

const userSchema = inferSchema(userData);
console.log('Inferred schema:', JSON.stringify(userSchema, null, 2));

// ============================================================================
// Example 2: Validating Data Against Schema
// ============================================================================

const validUser = {
  name: 'Jane Smith',
  age: 25,
  email: 'jane@example.com',
  isActive: false,
};

const invalidUser = {
  name: 'Invalid User',
  age: 'not a number', // Type error
  email: 'jane@example.com',
  isActive: false,
};

const validResult = validate(validUser, userSchema);
console.log('Valid user:', validResult.valid); // true

const invalidResult = validate(invalidUser, userSchema);
console.log('Invalid user:', invalidResult.valid); // false
console.log('Errors:', invalidResult.errors);

// ============================================================================
// Example 3: Schema from Multiple Samples
// ============================================================================

const users = [
  { name: 'John', age: 30, city: 'NYC', country: 'USA' },
  { name: 'Jane', age: 25, state: 'CA' },
  { name: 'Bob', age: 35, city: 'London', country: 'UK' },
];

const multiSampleSchema = inferSchemaFromSamples(users);
console.log('Multi-sample schema:', JSON.stringify(multiSampleSchema, null, 2));

// Properties: name, age (required in all)
// Optional: city, country, state (not in all samples)

// ============================================================================
// Example 4: Format Detection
// ============================================================================

const dataWithFormats = {
  email: 'test@example.com',
  website: 'https://example.com',
  birthdate: '1990-01-15',
  lastLogin: '2024-01-15T10:30:00Z',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  ipAddress: '192.168.1.1',
};

const formatSchema = inferSchema(dataWithFormats, { inferFormats: true });
console.log('Schema with formats:', JSON.stringify(formatSchema, null, 2));

// ============================================================================
// Example 5: Nested Objects and Arrays
// ============================================================================

const complexData = {
  user: {
    profile: {
      name: 'John',
      bio: 'Software developer',
    },
    settings: {
      theme: 'dark',
      notifications: true,
    },
  },
  posts: [
    { title: 'First Post', likes: 10, tags: ['tech', 'coding'] },
    { title: 'Second Post', likes: 5, tags: ['web', 'design'] },
  ],
  metadata: {
    created: '2024-01-15',
    updated: '2024-01-20',
  },
};

const complexSchema = inferSchema(complexData);
console.log('Complex schema:', JSON.stringify(complexSchema, null, 2));

// ============================================================================
// Example 6: Quick Type Checking
// ============================================================================

// Check if value matches schema (including constraints)
const userSchemaRoot = userSchema.root;
console.log('Matches schema:', matches(validUser, userSchemaRoot)); // true
console.log('Matches schema:', matches(invalidUser, userSchemaRoot)); // false

// Check if value matches only the type (no constraints)
console.log('Matches type:', matchesType({ name: 'Test' }, userSchemaRoot)); // true (missing fields, but correct types)

// ============================================================================
// Example 7: Using Schemas for Validation with Custom Constraints
// ============================================================================

const passwordSchema: Schema = {
  root: {
    type: 'string',
    minLength: 8,
    maxLength: 50,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$', // At least one lowercase, uppercase, and digit
  },
  metadata: {
    source: 'manual',
  },
};

const validPassword = 'SecurePass123';
const weakPassword = 'weak';

console.log('Valid password:', validate(validPassword, passwordSchema).valid); // true
console.log('Weak password:', validate(weakPassword, passwordSchema).valid); // false

// ============================================================================
// Example 8: Validating API Responses
// ============================================================================

// Define expected API response schema
const apiResponseData = {
  status: 'success',
  data: {
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    total: 2,
    page: 1,
  },
  timestamp: '2024-01-15T10:30:00Z',
};

const apiSchema = inferSchema(apiResponseData, { inferFormats: true });

// Validate incoming API responses
function validateApiResponse(response: unknown): boolean {
  const result = validate(response, apiSchema);
  if (!result.valid) {
    console.error('API response validation failed:', result.errors);
    return false;
  }
  return true;
}

const mockResponse = {
  status: 'success',
  data: {
    users: [
      { id: 3, name: 'Bob' },
      { id: 4, name: 'Alice' },
    ],
    total: 2,
    page: 1,
  },
  timestamp: '2024-01-20T14:20:00Z',
};

console.log('API response valid:', validateApiResponse(mockResponse));

// ============================================================================
// Example 9: Schema Evolution (Handling Optional Fields)
// ============================================================================

// Original schema
const v1Users = [{ id: 1, name: 'John' }];
const schemaV1 = inferSchemaFromSamples(v1Users);

// New data with additional fields
const v2Users = [
  { id: 2, name: 'Jane', email: 'jane@example.com' },
  { id: 3, name: 'Bob', email: 'bob@example.com', phone: '555-0123' },
];

// Schema evolves to include new optional fields
inferSchemaFromSamples(v2Users); // schemaV2 includes email (required) and phone (optional)

// Old data can still validate against new schema if additional properties are allowed
console.log('V1 data against V1 schema:', validate(v1Users[0], schemaV1).valid);

// ============================================================================
// Example 10: Debugging Validation Errors
// ============================================================================

const invalidData = {
  name: 123, // Should be string
  age: 'thirty', // Should be number
  email: 'not-an-email', // Invalid email format
  isActive: 'yes', // Should be boolean
};

const debugSchema = inferSchema(
  {
    name: 'string',
    age: 30,
    email: 'test@example.com',
    isActive: true,
  },
  { inferFormats: true },
);

const debugResult = validate(invalidData, debugSchema);
console.log('\nValidation errors:');
for (const error of debugResult.errors) {
  console.log(`  [${error.path.join('.')}] ${error.message}`);
  console.log(`    Expected: ${error.expected}`);
  console.log(`    Actual: ${error.actual}`);
  console.log(`    Rule: ${error.rule}`);
}

export {
  apiSchema,
  complexSchema,
  formatSchema,
  multiSampleSchema,
  passwordSchema,
  userSchema,
};
