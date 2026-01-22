/**
 * Utilities for detecting and handling circular references in objects
 */

/**
 * Checks if a value contains circular references
 *
 * @param value - The value to check
 * @returns true if the value contains circular references
 *
 * @example
 * const obj = { a: 1 };
 * obj.self = obj;
 * hasCircularReference(obj); // true
 */
export function hasCircularReference(value: unknown): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const seen = new WeakSet<object>();

  function check(obj: unknown): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (seen.has(obj)) {
      return true;
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (check(item)) {
          return true;
        }
      }
    } else {
      for (const key of Object.keys(obj)) {
        if (check((obj as Record<string, unknown>)[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return check(value);
}

/**
 * Placeholder string used for circular references in stringified output
 */
export const CIRCULAR_REF_PLACEHOLDER = '[Circular Reference]';

/**
 * Safely stringifies a value, replacing circular references with a placeholder
 *
 * @param value - The value to stringify
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns JSON string with circular references replaced
 *
 * @example
 * const obj = { a: 1 };
 * obj.self = obj;
 * safeStringify(obj); // '{"a":1,"self":"[Circular Reference]"}'
 */
export function safeStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_key, val) => {
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return CIRCULAR_REF_PLACEHOLDER;
        }
        seen.add(val);
      }
      return val;
    },
    indent,
  );
}

/**
 * Creates a deep clone of a value, breaking circular references
 * Circular references are replaced with the placeholder string
 *
 * @param value - The value to clone
 * @returns A deep clone with circular references replaced
 */
export function cloneWithoutCircular<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const seen = new WeakMap<object, unknown>();

  function clone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (seen.has(obj)) {
      return CIRCULAR_REF_PLACEHOLDER;
    }

    if (Array.isArray(obj)) {
      const result: unknown[] = [];
      seen.set(obj, result);
      for (const item of obj) {
        result.push(clone(item));
      }
      return result;
    }

    const result: Record<string, unknown> = {};
    seen.set(obj, result);
    for (const key of Object.keys(obj)) {
      result[key] = clone((obj as Record<string, unknown>)[key]);
    }
    return result;
  }

  return clone(value) as T;
}
