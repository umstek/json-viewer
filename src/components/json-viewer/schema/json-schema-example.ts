/**
 * Example usage of JSON Schema validation in the JSON viewer
 *
 * This file demonstrates how to use the JSON Schema validation features
 * implemented in this library.
 */

import type { JSONSchemaObject } from './json-schema';
import {
  convertJSONSchemaToSchema,
  createJSONSchemaValidator,
  validateWithJSONSchema,
} from './json-schema';

// Example 1: Basic JSON Schema validation
const userSchema: JSONSchemaObject = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    email: {
      type: 'string',
      format: 'email',
    },
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150,
    },
    isActive: {
      type: 'boolean',
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      maxItems: 10,
    },
  },
  required: ['name', 'email', 'age'],
  additionalProperties: false,
};

// Valid data
const validUser = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  tags: ['developer', 'typescript'],
};

// Invalid data
const invalidUser = {
  name: '', // Too short
  email: 'invalid-email', // Invalid format
  age: 200, // Exceeds maximum
  isActive: 'yes', // Wrong type
  tags: [], // Too few items
  extra: 'not allowed', // Additional property
};

// Validate the data
const result1 = validateWithJSONSchema(validUser, userSchema);
console.log('Valid user:', result1.valid); // true

const result2 = validateWithJSONSchema(invalidUser, userSchema);
console.log('Invalid user:', result2.valid); // false
console.log('Errors:', result2.errors);

// Example 2: Using a reusable validator
const validateUser = createJSONSchemaValidator(userSchema);

const user1Result = validateUser(validUser);
const user2Result = validateUser(invalidUser);

console.log('User 1 valid:', user1Result.valid);
console.log('User 2 valid:', user2Result.valid);

// Example 3: Complex nested schema
const blogPostSchema: JSONSchemaObject = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Blog Post',
  description: 'A blog post with author and comments',
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 5,
      maxLength: 200,
    },
    content: {
      type: 'string',
      minLength: 10,
    },
    author: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        bio: { type: 'string', nullable: true },
      },
      required: ['name', 'email'],
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
    },
    comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          author: { type: 'string' },
          content: { type: 'string', minLength: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['author', 'content', 'createdAt'],
      },
    },
    status: {
      type: 'string',
      enum: ['draft', 'published', 'archived'],
    },
  },
  required: ['title', 'content', 'author', 'publishedAt', 'status'],
};

const blogPost = {
  title: 'Getting Started with TypeScript',
  content: 'TypeScript is a typed superset of JavaScript...',
  author: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: null,
  },
  publishedAt: '2025-01-15T10:30:00Z',
  tags: ['typescript', 'javascript', 'programming'],
  comments: [
    {
      author: 'John',
      content: 'Great article!',
      createdAt: '2025-01-15T11:00:00Z',
    },
  ],
  status: 'published',
};

const blogResult = validateWithJSONSchema(blogPost, blogPostSchema);
console.log('Blog post valid:', blogResult.valid);

// Example 4: Converting JSON Schema to internal schema format
const internalSchema = convertJSONSchemaToSchema(userSchema);
console.log('Internal schema:', internalSchema);

// Example 5: Using with JsonViewer component
/*
import JsonViewer from '@/components/json-viewer';

function MyComponent() {
  const jsonData = JSON.stringify(invalidUser, null, 2);

  return (
    <JsonViewer
      json={jsonData}
      jsonSchema={userSchema}
      showValidationErrors={true}
    />
  );
}

// The viewer will:
// 1. Validate the JSON data against the schema
// 2. Show a validation error panel at the top if there are errors
// 3. Highlight invalid fields in the tree with red background and error icons
// 4. Show detailed error messages in tooltips when hovering over invalid fields
*/

// Example 6: JSON Schema with validation options
const result3 = validateWithJSONSchema(
  { name: 'John', email: 'john@example.com', age: '30' },
  userSchema,
  {
    coerceTypes: true, // Automatically convert "30" to 30
    validateFormats: true, // Validate email format
  },
);
console.log('With coercion:', result3.valid);

// Example 7: Using nullable and union types
const flexibleSchema: JSONSchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: ['string', 'number'], // Can be string or number
    },
    value: {
      type: 'string',
      nullable: true, // Can be null
    },
  },
};

const validFlexible1 = { id: '123', value: 'test' };
const validFlexible2 = { id: 123, value: null };

console.log(
  'Flexible 1:',
  validateWithJSONSchema(validFlexible1, flexibleSchema).valid,
);
console.log(
  'Flexible 2:',
  validateWithJSONSchema(validFlexible2, flexibleSchema).valid,
);

// Example 8: Schema with patterns and formats
const advancedSchema: JSONSchemaObject = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]{3,20}$',
    },
    phoneNumber: {
      type: 'string',
      format: 'phone',
    },
    website: {
      type: 'string',
      format: 'uri',
    },
    apiKey: {
      type: 'string',
      format: 'uuid',
    },
    ipAddress: {
      type: 'string',
      format: 'ipv4',
    },
  },
};

const advancedData = {
  username: 'john_doe',
  phoneNumber: '+1-555-123-4567',
  website: 'https://example.com',
  apiKey: '550e8400-e29b-41d4-a716-446655440000',
  ipAddress: '192.168.1.1',
};

console.log(
  'Advanced validation:',
  validateWithJSONSchema(advancedData, advancedSchema).valid,
);

export {
  advancedData,
  advancedSchema,
  blogPost,
  blogPostSchema,
  flexibleSchema,
  invalidUser,
  userSchema,
  validUser,
};
