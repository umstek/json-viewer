/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { inferSchema, inferSchemaFromSamples } from './inference';

describe('Schema Inference', () => {
  describe('inferSchema', () => {
    it('should infer schema for primitive types', () => {
      expect(inferSchema('hello').root.type).toBe('string');
      expect(inferSchema(42).root.type).toBe('number');
      expect(inferSchema(true).root.type).toBe('boolean');
      expect(inferSchema(null).root.type).toBe('null');
    });

    it('should infer schema for simple object', () => {
      const data = {
        name: 'John',
        age: 30,
        active: true,
      };

      const schema = inferSchema(data);

      expect(schema.root.type).toBe('object');
      if (schema.root.type === 'object') {
        expect(schema.root.properties.name.type).toBe('string');
        expect(schema.root.properties.age.type).toBe('number');
        expect(schema.root.properties.active.type).toBe('boolean');
        expect(schema.root.required).toEqual(['name', 'age', 'active']);
      }
    });

    it('should infer schema for nested objects', () => {
      const data = {
        user: {
          name: 'John',
          address: {
            city: 'NYC',
            zip: '10001',
          },
        },
      };

      const schema = inferSchema(data);

      expect(schema.root.type).toBe('object');
      if (schema.root.type === 'object') {
        expect(schema.root.properties.user.type).toBe('object');
        const userSchema = schema.root.properties.user;
        if (userSchema.type === 'object') {
          expect(userSchema.properties.name.type).toBe('string');
          expect(userSchema.properties.address.type).toBe('object');
        }
      }
    });

    it('should infer schema for arrays', () => {
      const data = {
        tags: ['typescript', 'react', 'vite'],
        scores: [95, 87, 92],
      };

      const schema = inferSchema(data);

      if (schema.root.type === 'object') {
        expect(schema.root.properties.tags.type).toBe('array');
        expect(schema.root.properties.scores.type).toBe('array');

        const tagsSchema = schema.root.properties.tags;
        if (tagsSchema.type === 'array' && tagsSchema.items) {
          expect(tagsSchema.items.type).toBe('string');
        }

        const scoresSchema = schema.root.properties.scores;
        if (scoresSchema.type === 'array' && scoresSchema.items) {
          expect(scoresSchema.items.type).toBe('number');
        }
      }
    });

    it('should infer schema for array of objects', () => {
      const data = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      };

      const schema = inferSchema(data);

      if (schema.root.type === 'object') {
        const usersSchema = schema.root.properties.users;
        expect(usersSchema.type).toBe('array');

        if (usersSchema.type === 'array' && usersSchema.items) {
          expect(usersSchema.items.type).toBe('object');
          if (usersSchema.items.type === 'object') {
            expect(usersSchema.items.properties.name.type).toBe('string');
            expect(usersSchema.items.properties.age.type).toBe('number');
          }
        }
      }
    });

    it('should detect string formats', () => {
      const data = {
        email: 'test@example.com',
        website: 'https://example.com',
        date: '2024-01-15',
        datetime: '2024-01-15T10:30:00Z',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
      };

      const schema = inferSchema(data, { inferFormats: true });

      if (schema.root.type === 'object') {
        const props = schema.root.properties;
        expect((props.email as { format?: string }).format).toBe('email');
        expect((props.website as { format?: string }).format).toBe('uri');
        expect((props.date as { format?: string }).format).toBe('date');
        expect((props.datetime as { format?: string }).format).toBe(
          'date-time',
        );
        expect((props.uuid as { format?: string }).format).toBe('uuid');
      }
    });

    it('should include examples when requested', () => {
      const data = { name: 'John', age: 30 };

      const schema = inferSchema(data, { includeExamples: true });

      if (schema.root.type === 'object') {
        expect(schema.root.properties.name.examples).toContain('John');
        expect(schema.root.properties.age.examples).toContain(30);
      }
    });

    it('should handle empty arrays', () => {
      const data = { items: [] };

      const schema = inferSchema(data);

      if (schema.root.type === 'object') {
        expect(schema.root.properties.items.type).toBe('array');
      }
    });
  });

  describe('inferSchemaFromSamples', () => {
    it('should merge schemas from multiple samples', () => {
      const samples = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, country: 'USA' },
      ];

      const schema = inferSchemaFromSamples(samples);

      if (schema.root.type === 'object') {
        expect(schema.root.properties.name).toBeDefined();
        expect(schema.root.properties.age).toBeDefined();
        expect(schema.root.properties.city).toBeDefined();
        expect(schema.root.properties.country).toBeDefined();
      }
    });

    it('should mark properties as required only if present in all samples', () => {
      const samples = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25 },
      ];

      const schema = inferSchemaFromSamples(samples);

      if (schema.root.type === 'object') {
        // name and age are in both samples
        expect(schema.root.required).toContain('name');
        expect(schema.root.required).toContain('age');
        // city is only in first sample
        expect(schema.root.required).not.toContain('city');
      }
    });

    it('should handle heterogeneous arrays', () => {
      const samples = [{ items: [1, 2, 3] }, { items: ['a', 'b', 'c'] }];

      const schema = inferSchemaFromSamples(samples);

      if (schema.root.type === 'object') {
        const itemsSchema = schema.root.properties.items;
        expect(itemsSchema.type).toBe('array');
        // Items schema should be nullable or flexible since types differ
        if (itemsSchema.type === 'array' && itemsSchema.items) {
          expect(itemsSchema.items.nullable).toBe(true);
        }
      }
    });

    it('should throw error for empty samples', () => {
      expect(() => inferSchemaFromSamples([])).toThrow();
    });
  });
});
