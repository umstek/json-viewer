import { describe, expect, it } from 'vitest';
import {
  CIRCULAR_REF_PLACEHOLDER,
  cloneWithoutCircular,
  hasCircularReference,
  safeStringify,
} from './circular-detection';

describe('hasCircularReference', () => {
  it('should return false for primitives', () => {
    expect(hasCircularReference(null)).toBe(false);
    expect(hasCircularReference(undefined)).toBe(false);
    expect(hasCircularReference(42)).toBe(false);
    expect(hasCircularReference('hello')).toBe(false);
    expect(hasCircularReference(true)).toBe(false);
  });

  it('should return false for simple objects', () => {
    expect(hasCircularReference({})).toBe(false);
    expect(hasCircularReference({ a: 1, b: 2 })).toBe(false);
    expect(hasCircularReference({ nested: { deep: { value: 1 } } })).toBe(
      false,
    );
  });

  it('should return false for simple arrays', () => {
    expect(hasCircularReference([])).toBe(false);
    expect(hasCircularReference([1, 2, 3])).toBe(false);
    expect(
      hasCircularReference([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(false);
  });

  it('should detect circular reference in object', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(hasCircularReference(obj)).toBe(true);
  });

  it('should detect circular reference in array', () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr);
    expect(hasCircularReference(arr)).toBe(true);
  });

  it('should detect nested circular reference', () => {
    const obj: Record<string, unknown> = {
      level1: {
        level2: {
          level3: {},
        },
      },
    };
    (obj.level1 as Record<string, unknown>).level2 = obj;
    expect(hasCircularReference(obj)).toBe(true);
  });

  it('should detect cross-reference between objects', () => {
    const obj1: Record<string, unknown> = { name: 'obj1' };
    const obj2: Record<string, unknown> = { name: 'obj2' };
    obj1.ref = obj2;
    obj2.ref = obj1;
    expect(hasCircularReference(obj1)).toBe(true);
  });

  it('should detect circular reference in array of objects', () => {
    const obj: Record<string, unknown> = { id: 1 };
    const arr = [obj];
    obj.parent = arr;
    expect(hasCircularReference(arr)).toBe(true);
  });
});

describe('safeStringify', () => {
  it('should stringify simple values', () => {
    expect(safeStringify({ a: 1, b: 2 })).toBe('{\n  "a": 1,\n  "b": 2\n}');
    expect(safeStringify([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('should handle circular reference in object', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = safeStringify(obj);
    expect(result).toContain('"a": 1');
    expect(result).toContain(CIRCULAR_REF_PLACEHOLDER);
  });

  it('should handle circular reference in array', () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr);
    const result = safeStringify(arr);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain(CIRCULAR_REF_PLACEHOLDER);
  });

  it('should handle nested circular reference', () => {
    const obj: Record<string, unknown> = {
      level1: {},
    };
    (obj.level1 as Record<string, unknown>).back = obj;
    const result = safeStringify(obj);
    expect(result).toContain(CIRCULAR_REF_PLACEHOLDER);
  });

  it('should respect indent parameter', () => {
    const result = safeStringify({ a: 1 }, 4);
    expect(result).toBe('{\n    "a": 1\n}');
  });
});

describe('cloneWithoutCircular', () => {
  it('should clone primitives', () => {
    expect(cloneWithoutCircular(null)).toBe(null);
    expect(cloneWithoutCircular(42)).toBe(42);
    expect(cloneWithoutCircular('hello')).toBe('hello');
    expect(cloneWithoutCircular(true)).toBe(true);
  });

  it('should deep clone simple objects', () => {
    const obj = { a: 1, nested: { b: 2 } };
    const clone = cloneWithoutCircular(obj);

    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.nested).not.toBe(obj.nested);
  });

  it('should deep clone arrays', () => {
    const arr = [1, [2, 3], { a: 4 }];
    const clone = cloneWithoutCircular(arr);

    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
    expect(clone[1]).not.toBe(arr[1]);
  });

  it('should replace circular reference with placeholder', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;

    const clone = cloneWithoutCircular(obj);

    expect(clone.a).toBe(1);
    expect(clone.self).toBe(CIRCULAR_REF_PLACEHOLDER);
    expect(hasCircularReference(clone)).toBe(false);
  });

  it('should handle nested circular reference', () => {
    const obj: Record<string, unknown> = {
      level1: {
        level2: {},
      },
    };
    (
      (obj.level1 as Record<string, unknown>).level2 as Record<string, unknown>
    ).back = obj;

    const clone = cloneWithoutCircular(obj);
    expect(hasCircularReference(clone)).toBe(false);
  });

  it('should handle array with circular reference', () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr);

    const clone = cloneWithoutCircular(arr);
    expect(clone[0]).toBe(1);
    expect(clone[1]).toBe(2);
    expect(clone[2]).toBe(CIRCULAR_REF_PLACEHOLDER);
    expect(hasCircularReference(clone)).toBe(false);
  });
});
