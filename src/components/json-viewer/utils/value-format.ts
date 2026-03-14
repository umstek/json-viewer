import { safeStringify } from './circular-detection';

export function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return safeStringify(value, 2);
}
