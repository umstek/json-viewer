import { describe, expect, it } from 'vitest';
import {
  calculateDiffStats,
  computeDiff,
  filterUnchanged,
  flattenDiff,
} from './diff';

describe('computeDiff', () => {
  it('should detect unchanged primitive values', () => {
    const result = computeDiff('hello', 'hello');
    expect(result.type).toBe('unchanged');
    expect(result.leftValue).toBe('hello');
    expect(result.rightValue).toBe('hello');
  });

  it('should detect modified primitive values', () => {
    const result = computeDiff('hello', 'world');
    expect(result.type).toBe('modified');
    expect(result.leftValue).toBe('hello');
    expect(result.rightValue).toBe('world');
  });

  it('should detect added values', () => {
    const result = computeDiff(undefined, 'new value');
    expect(result.type).toBe('added');
    expect(result.rightValue).toBe('new value');
  });

  it('should detect removed values', () => {
    const result = computeDiff('old value', undefined);
    expect(result.type).toBe('removed');
    expect(result.leftValue).toBe('old value');
  });

  it('should handle null values', () => {
    const result1 = computeDiff(null, 'value');
    expect(result1.type).toBe('modified');

    const result2 = computeDiff('value', null);
    expect(result2.type).toBe('modified');
  });

  it('should detect unchanged objects', () => {
    const obj = { a: 1, b: 2 };
    const result = computeDiff(obj, obj);
    expect(result.type).toBe('unchanged');
  });

  it('should detect modified objects', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1, b: 3 };
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    expect(result.children).toBeDefined();
    expect(result.children?.length).toBe(2);

    const bChild = result.children?.find((c) => c.key === 'b');
    expect(bChild?.type).toBe('modified');
    expect(bChild?.leftValue).toBe(2);
    expect(bChild?.rightValue).toBe(3);
  });

  it('should detect added object properties', () => {
    const left = { a: 1 };
    const right = { a: 1, b: 2 };
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    const bChild = result.children?.find((c) => c.key === 'b');
    expect(bChild?.type).toBe('added');
    expect(bChild?.rightValue).toBe(2);
  });

  it('should detect removed object properties', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1 };
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    const bChild = result.children?.find((c) => c.key === 'b');
    expect(bChild?.type).toBe('removed');
    expect(bChild?.leftValue).toBe(2);
  });

  it('should handle nested objects', () => {
    const left = {
      user: {
        name: 'John',
        age: 30,
      },
    };
    const right = {
      user: {
        name: 'Jane',
        age: 30,
      },
    };
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    const userChild = result.children?.find((c) => c.key === 'user');
    expect(userChild?.type).toBe('modified');

    const nameChild = userChild?.children?.find((c) => c.key === 'name');
    expect(nameChild?.type).toBe('modified');
    expect(nameChild?.leftValue).toBe('John');
    expect(nameChild?.rightValue).toBe('Jane');

    const ageChild = userChild?.children?.find((c) => c.key === 'age');
    expect(ageChild?.type).toBe('unchanged');
  });

  it('should detect unchanged arrays', () => {
    const arr = [1, 2, 3];
    const result = computeDiff(arr, arr);
    expect(result.type).toBe('unchanged');
  });

  it('should detect modified arrays', () => {
    const left = [1, 2, 3];
    const right = [1, 5, 3];
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    expect(result.children?.length).toBe(3);

    const item1 = result.children?.find((c) => c.key === 1);
    expect(item1?.type).toBe('modified');
    expect(item1?.leftValue).toBe(2);
    expect(item1?.rightValue).toBe(5);
  });

  it('should handle arrays of different lengths', () => {
    const left = [1, 2];
    const right = [1, 2, 3];
    const result = computeDiff(left, right);

    expect(result.type).toBe('modified');
    expect(result.children?.length).toBe(3);

    const item2 = result.children?.find((c) => c.key === 2);
    expect(item2?.type).toBe('added');
    expect(item2?.rightValue).toBe(3);
  });

  it('should handle complex nested structures', () => {
    const left = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      settings: {
        theme: 'dark',
        notifications: true,
      },
    };

    const right = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bobby' },
      ],
      settings: {
        theme: 'light',
        notifications: true,
      },
    };

    const result = computeDiff(left, right);
    expect(result.type).toBe('modified');

    // Check users array
    const usersChild = result.children?.find((c) => c.key === 'users');
    expect(usersChild?.type).toBe('modified');

    // Check second user
    const user1 = usersChild?.children?.find((c) => c.key === 1);
    expect(user1?.type).toBe('modified');

    const userName = user1?.children?.find((c) => c.key === 'name');
    expect(userName?.type).toBe('modified');
    expect(userName?.leftValue).toBe('Bob');
    expect(userName?.rightValue).toBe('Bobby');

    // Check settings
    const settingsChild = result.children?.find((c) => c.key === 'settings');
    expect(settingsChild?.type).toBe('modified');

    const themeChild = settingsChild?.children?.find((c) => c.key === 'theme');
    expect(themeChild?.type).toBe('modified');
    expect(themeChild?.leftValue).toBe('dark');
    expect(themeChild?.rightValue).toBe('light');
  });
});

describe('calculateDiffStats', () => {
  it('should calculate stats for simple changes', () => {
    const diff = computeDiff({ a: 1, b: 2 }, { a: 1, c: 3 });
    const stats = calculateDiffStats(diff);

    expect(stats.added).toBe(1); // c
    expect(stats.removed).toBe(1); // b
    expect(stats.unchanged).toBe(1); // a
  });

  it('should calculate stats for nested structures', () => {
    const left = {
      user: {
        name: 'John',
        age: 30,
      },
      active: true,
    };

    const right = {
      user: {
        name: 'Jane',
        age: 30,
      },
      active: false,
    };

    const diff = computeDiff(left, right);
    const stats = calculateDiffStats(diff);

    expect(stats.modified).toBe(2); // name, active
    expect(stats.unchanged).toBe(1); // age
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });
});

describe('flattenDiff', () => {
  it('should flatten diff tree into a list', () => {
    const diff = computeDiff(
      { a: 1, b: { c: 2 } },
      { a: 2, b: { c: 2, d: 3 } },
    );
    const flattened = flattenDiff(diff);

    expect(flattened.length).toBeGreaterThan(0);
    expect(flattened.some((node) => node.type === 'modified')).toBe(true);
    expect(flattened.some((node) => node.type === 'added')).toBe(true);
  });
});

describe('filterUnchanged', () => {
  it('should remove unchanged nodes', () => {
    const diff = computeDiff({ a: 1, b: 2, c: 3 }, { a: 1, b: 5, c: 3 });
    const filtered = filterUnchanged(diff);

    expect(filtered).not.toBeNull();
    expect(filtered?.children?.length).toBe(1); // only 'b' should remain
    expect(filtered?.children?.[0].key).toBe('b');
    expect(filtered?.children?.[0].type).toBe('modified');
  });

  it('should return null for completely unchanged structures', () => {
    const diff = computeDiff({ a: 1, b: 2 }, { a: 1, b: 2 });
    const filtered = filterUnchanged(diff);

    expect(filtered).toBeNull();
  });

  it('should preserve structure when filtering nested changes', () => {
    const left = {
      user: {
        name: 'John',
        age: 30,
      },
      settings: {
        theme: 'dark',
      },
    };

    const right = {
      user: {
        name: 'Jane',
        age: 30,
      },
      settings: {
        theme: 'dark',
      },
    };

    const diff = computeDiff(left, right);
    const filtered = filterUnchanged(diff);

    expect(filtered).not.toBeNull();
    expect(filtered?.children?.some((c) => c.key === 'user')).toBe(true);
    expect(filtered?.children?.some((c) => c.key === 'settings')).toBe(false);
  });
});
