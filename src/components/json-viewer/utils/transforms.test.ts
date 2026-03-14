/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vite-plus/test';
import { createPathTransformer } from './transforms';

describe('createPathTransformer', () => {
  it('does not confuse dotted keys with nested paths', () => {
    const transformer = createPathTransformer('a.b', () => 'matched');

    expect(transformer({ value: 'nested', path: ['a', 'b'] })).toBe('matched');
    expect(transformer({ value: 'flat', path: ['a.b'] })).toBe('flat');
  });

  it('supports JSON Pointer for exact matching', () => {
    const transformer = createPathTransformer('/a.b', () => 'matched');

    expect(transformer({ value: 'flat', path: ['a.b'] })).toBe('matched');
    expect(transformer({ value: 'nested', path: ['a', 'b'] })).toBe('nested');
  });
});
