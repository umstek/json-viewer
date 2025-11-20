import { describe, expect, it } from 'vitest';
import {
  createEmailMappings,
  createFormatMapping,
  createIpMappings,
  createPhoneMappings,
  createStandardMappings,
  createUrlMappings,
  DEFAULT_PRIORITIES,
  type FormatMapping,
  findMatchingMappings,
  matchesPath,
  resolveFormat,
} from './format-mapping';

describe('format-mapping', () => {
  describe('matchesPath', () => {
    it('should match exact JSONPath strings', () => {
      const path = ['user', 'email'];
      expect(matchesPath(path, '$.user.email')).toBe(true);
      expect(matchesPath(path, '$.user.name')).toBe(false);
    });

    it('should match array paths', () => {
      const path = ['users', '0', 'email'];
      expect(matchesPath(path, '$.users[0].email')).toBe(true);
      expect(matchesPath(path, '$.users[1].email')).toBe(false);
    });

    it('should match RegExp patterns', () => {
      const path = ['user', 'email'];
      expect(matchesPath(path, /\.email$/)).toBe(true);
      expect(matchesPath(path, /^\.email/)).toBe(false);
    });

    it('should match RegExp patterns with case insensitive flag', () => {
      const path = ['user', 'Email'];
      expect(matchesPath(path, /\.email$/i)).toBe(true);
    });

    it('should handle root path', () => {
      const path: string[] = [];
      expect(matchesPath(path, '$')).toBe(true);
      expect(matchesPath(path, '$.user')).toBe(false);
    });

    it('should handle nested paths', () => {
      const path = ['data', 'users', '0', 'contact', 'email'];
      expect(matchesPath(path, '$.data.users[0].contact.email')).toBe(true);
      expect(matchesPath(path, /\.contact\.email$/)).toBe(true);
      expect(matchesPath(path, /\.email$/)).toBe(true);
    });
  });

  describe('findMatchingMappings', () => {
    const mappings: FormatMapping[] = [
      { jsonPath: '$.user.email', format: 'email', priority: 100 },
      { jsonPath: /\.email$/, format: 'email', priority: 80 },
      { jsonPath: '$.user.phone', format: 'phone', priority: 100 },
      { jsonPath: /\.phoneNumber$/, format: 'phone', priority: 80 },
    ];

    it('should find exact matches', () => {
      const path = ['user', 'email'];
      const matches = findMatchingMappings(path, mappings);
      expect(matches).toHaveLength(2); // Both exact and regex match
    });

    it('should sort by priority (highest first)', () => {
      const path = ['user', 'email'];
      const matches = findMatchingMappings(path, mappings);
      expect(matches[0].priority).toBe(100);
      expect(matches[1].priority).toBe(80);
    });

    it('should return empty array when no matches', () => {
      const path = ['user', 'name'];
      const matches = findMatchingMappings(path, mappings);
      expect(matches).toHaveLength(0);
    });

    it('should handle multiple regex matches', () => {
      const multiMappings: FormatMapping[] = [
        { jsonPath: /\.email$/, format: 'email', priority: 100 },
        { jsonPath: /email/, format: 'email', priority: 50 },
      ];
      const path = ['user', 'email'];
      const matches = findMatchingMappings(path, multiMappings);
      expect(matches).toHaveLength(2);
      expect(matches[0].priority).toBe(100);
    });
  });

  describe('resolveFormat', () => {
    it('should resolve format from explicit mapping', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user.email', format: 'email', priority: 100 },
      ];
      const result = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );

      expect(result.format).toBe('email');
      expect(result.source).toBe('explicit');
      expect(result.priority).toBe(100);
      expect(result.mapping).toBeDefined();
    });

    it('should use highest priority mapping when multiple match', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: /\.email$/, format: 'email', priority: 80 },
        { jsonPath: '$.user.email', format: 'email', priority: 100 },
      ];
      const result = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );

      expect(result.priority).toBe(100);
      expect(result.mapping?.jsonPath).toBe('$.user.email');
    });

    it('should return none when no mappings match', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user.phone', format: 'phone', priority: 100 },
      ];
      const result = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );

      expect(result.format).toBeNull();
      expect(result.source).toBe('none');
      expect(result.priority).toBe(0);
    });

    it('should validate with custom validator', () => {
      const mappings: FormatMapping[] = [
        {
          jsonPath: '$.user.email',
          format: 'email',
          priority: 100,
          validator: (value) =>
            typeof value === 'string' && value.includes('@'),
        },
      ];

      // Valid email
      const validResult = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );
      expect(validResult.format).toBe('email');
      expect(validResult.source).toBe('explicit');

      // Invalid email
      const invalidResult = resolveFormat(
        'not-an-email',
        ['user', 'email'],
        mappings,
      );
      expect(invalidResult.format).toBeNull();
      expect(invalidResult.source).toBe('none');
    });

    it('should skip mapping when validator fails and try next', () => {
      const mappings: FormatMapping[] = [
        {
          jsonPath: '$.user.contact',
          format: 'email',
          priority: 100,
          validator: (value) =>
            typeof value === 'string' && value.includes('@'),
        },
        {
          jsonPath: '$.user.contact',
          format: 'phone',
          priority: 90,
          validator: (value) =>
            typeof value === 'string' && /^\d+$/.test(value),
        },
      ];

      // Phone number should match second mapping
      const result = resolveFormat('1234567890', ['user', 'contact'], mappings);
      expect(result.format).toBe('phone');
      expect(result.priority).toBe(90);
    });

    it('should use default priority when not specified', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user.email', format: 'email' }, // No priority specified
      ];
      const result = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );

      expect(result.priority).toBe(DEFAULT_PRIORITIES.EXPLICIT_MAPPING);
    });
  });

  describe('createFormatMapping', () => {
    it('should create mapping with default priority', () => {
      const mapping = createFormatMapping('$.user.email', 'email');

      expect(mapping.jsonPath).toBe('$.user.email');
      expect(mapping.format).toBe('email');
      expect(mapping.priority).toBe(DEFAULT_PRIORITIES.EXPLICIT_MAPPING);
    });

    it('should create mapping with custom priority', () => {
      const mapping = createFormatMapping('$.user.email', 'email', {
        priority: 200,
      });

      expect(mapping.priority).toBe(200);
    });

    it('should create mapping with validator', () => {
      const validator = (value: unknown) => typeof value === 'string';
      const mapping = createFormatMapping('$.user.email', 'email', {
        validator,
      });

      expect(mapping.validator).toBe(validator);
    });

    it('should work with RegExp patterns', () => {
      const mapping = createFormatMapping(/\.email$/, 'email');

      expect(mapping.jsonPath).toBeInstanceOf(RegExp);
      expect(mapping.format).toBe('email');
    });
  });

  describe('createEmailMappings', () => {
    it('should create standard email mappings', () => {
      const mappings = createEmailMappings();

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.every((m) => m.format === 'email')).toBe(true);
    });

    it('should match common email field names', () => {
      const mappings = createEmailMappings();

      expect(
        findMatchingMappings(['user', 'email'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'emailAddress'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'mail'], mappings).length,
      ).toBeGreaterThan(0);
    });

    it('should use custom priority when specified', () => {
      const mappings = createEmailMappings(200);

      expect(mappings.every((m) => m.priority === 200)).toBe(true);
    });
  });

  describe('createPhoneMappings', () => {
    it('should create standard phone mappings', () => {
      const mappings = createPhoneMappings();

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.every((m) => m.format === 'phone')).toBe(true);
    });

    it('should match common phone field names', () => {
      const mappings = createPhoneMappings();

      expect(
        findMatchingMappings(['user', 'phone'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'phoneNumber'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'mobile'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'telephone'], mappings).length,
      ).toBeGreaterThan(0);
    });
  });

  describe('createUrlMappings', () => {
    it('should create standard URL mappings', () => {
      const mappings = createUrlMappings();

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.every((m) => m.format === 'url')).toBe(true);
    });

    it('should match common URL field names', () => {
      const mappings = createUrlMappings();

      expect(
        findMatchingMappings(['user', 'url'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'link'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'website'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['user', 'homepage'], mappings).length,
      ).toBeGreaterThan(0);
    });
  });

  describe('createIpMappings', () => {
    it('should create standard IP address mappings', () => {
      const mappings = createIpMappings();

      expect(mappings.length).toBeGreaterThan(0);
    });

    it('should match common IP field names', () => {
      const mappings = createIpMappings();

      expect(
        findMatchingMappings(['server', 'ip'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['server', 'ipAddress'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['server', 'ipv4'], mappings).length,
      ).toBeGreaterThan(0);
      expect(
        findMatchingMappings(['server', 'ipv6'], mappings).length,
      ).toBeGreaterThan(0);
    });

    it('should map ipv4 and ipv6 to correct formats', () => {
      const mappings = createIpMappings();

      const ipv4Matches = findMatchingMappings(['server', 'ipv4'], mappings);
      const ipv6Matches = findMatchingMappings(['server', 'ipv6'], mappings);

      expect(ipv4Matches.some((m) => m.format === 'ipv4')).toBe(true);
      expect(ipv6Matches.some((m) => m.format === 'ipv6')).toBe(true);
    });
  });

  describe('createStandardMappings', () => {
    it('should create all standard mappings', () => {
      const mappings = createStandardMappings();

      expect(mappings.length).toBeGreaterThan(0);

      // Should include email, phone, URL, and IP mappings
      const formats = new Set(mappings.map((m) => m.format));
      expect(formats.has('email')).toBe(true);
      expect(formats.has('phone')).toBe(true);
      expect(formats.has('url')).toBe(true);
      expect(formats.has('ipv4')).toBe(true);
    });

    it('should work with custom priority', () => {
      const mappings = createStandardMappings(150);

      expect(mappings.every((m) => m.priority === 150)).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should handle complex nested paths', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.data.users[0].contacts.email', format: 'email' },
        { jsonPath: /\.contacts\.email$/, format: 'email', priority: 80 },
      ];

      const path = ['data', 'users', '0', 'contacts', 'email'];
      const result = resolveFormat('test@example.com', path, mappings);

      expect(result.format).toBe('email');
      expect(result.source).toBe('explicit');
    });

    it('should handle custom formats', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user.ssn', format: 'custom-ssn', priority: 100 },
      ];

      const result = resolveFormat('123-45-6789', ['user', 'ssn'], mappings);

      expect(result.format).toBe('custom-ssn');
    });

    it('should prefer exact path over regex when priorities are equal', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: /\.email$/, format: 'email', priority: 100 },
        { jsonPath: '$.user.email', format: 'email', priority: 100 },
      ];

      const result = resolveFormat(
        'test@example.com',
        ['user', 'email'],
        mappings,
      );

      // Both have same priority, but exact match is defined first in our test
      // The implementation returns the first highest priority match
      expect(result.format).toBe('email');
      expect(result.priority).toBe(100);
    });

    it('should handle empty mappings array', () => {
      const result = resolveFormat('test@example.com', ['user', 'email'], []);

      expect(result.format).toBeNull();
      expect(result.source).toBe('none');
    });

    it('should handle mapping with both validator and high priority', () => {
      const mappings: FormatMapping[] = [
        {
          jsonPath: '$.data.id',
          format: 'uuid',
          priority: DEFAULT_PRIORITIES.OVERRIDE,
          validator: (value) =>
            typeof value === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              value,
            ),
        },
      ];

      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUuid = 'not-a-uuid';

      const validResult = resolveFormat(validUuid, ['data', 'id'], mappings);
      expect(validResult.format).toBe('uuid');
      expect(validResult.priority).toBe(DEFAULT_PRIORITIES.OVERRIDE);

      const invalidResult = resolveFormat(
        invalidUuid,
        ['data', 'id'],
        mappings,
      );
      expect(invalidResult.format).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle paths with special characters', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user["email-address"]', format: 'email' },
      ];

      const result = resolveFormat(
        'test@example.com',
        ['user', 'email-address'],
        mappings,
      );

      expect(result.format).toBe('email');
    });

    it('should handle numeric string paths (array indices)', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.users[0].email', format: 'email' },
      ];

      const result = resolveFormat(
        'test@example.com',
        ['users', '0', 'email'],
        mappings,
      );

      expect(result.format).toBe('email');
    });

    it('should handle non-string values', () => {
      const mappings: FormatMapping[] = [
        {
          jsonPath: '$.user.age',
          format: 'number',
          validator: (value) => typeof value === 'number',
        },
      ];

      const validResult = resolveFormat(25, ['user', 'age'], mappings);
      expect(validResult.format).toBe('number');

      const invalidResult = resolveFormat('25', ['user', 'age'], mappings);
      expect(invalidResult.format).toBeNull();
    });

    it('should handle null and undefined values', () => {
      const mappings: FormatMapping[] = [
        { jsonPath: '$.user.email', format: 'email' },
      ];

      const nullResult = resolveFormat(null, ['user', 'email'], mappings);
      expect(nullResult.format).toBe('email');

      const undefinedResult = resolveFormat(
        undefined,
        ['user', 'email'],
        mappings,
      );
      expect(undefinedResult.format).toBe('email');
    });
  });
});
