import { describe, expect, test } from 'vitest';
import {
  getArrayItemSortLabel,
  getObjectKeySortLabel,
  sortArrayItems,
  sortObjectEntries,
} from './sorting';

describe('sortObjectEntries', () => {
  const entries: [string, unknown][] = [
    ['zebra', 1],
    ['apple', 2],
    ['monkey', 3],
    ['banana', 4],
  ];

  test('should keep original order when mode is "original"', () => {
    const result = sortObjectEntries(entries, 'original');
    expect(result).toEqual(entries);
  });

  test('should sort alphabetically when mode is "alphabetical"', () => {
    const result = sortObjectEntries(entries, 'alphabetical');
    expect(result).toEqual([
      ['apple', 2],
      ['banana', 4],
      ['monkey', 3],
      ['zebra', 1],
    ]);
  });

  test('should sort in reverse alphabetical order when mode is "reverse-alphabetical"', () => {
    const result = sortObjectEntries(entries, 'reverse-alphabetical');
    expect(result).toEqual([
      ['zebra', 1],
      ['monkey', 3],
      ['banana', 4],
      ['apple', 2],
    ]);
  });
});

describe('sortArrayItems', () => {
  test('should keep original order when mode is "original"', () => {
    const items = [3, 1, 4, 1, 5, 9];
    const result = sortArrayItems(items, 'original');
    expect(result).toEqual(items);
  });

  test('should sort numbers in ascending order when mode is "ascending"', () => {
    const items = [3, 1, 4, 1, 5, 9];
    const result = sortArrayItems(items, 'ascending');
    expect(result).toEqual([1, 1, 3, 4, 5, 9]);
  });

  test('should sort numbers in descending order when mode is "descending"', () => {
    const items = [3, 1, 4, 1, 5, 9];
    const result = sortArrayItems(items, 'descending');
    expect(result).toEqual([9, 5, 4, 3, 1, 1]);
  });

  test('should sort strings alphabetically when mode is "alphabetical"', () => {
    const items = ['zebra', 'apple', 'monkey', 'banana'];
    const result = sortArrayItems(items, 'alphabetical');
    expect(result).toEqual(['apple', 'banana', 'monkey', 'zebra']);
  });

  test('should sort strings in reverse alphabetical order when mode is "reverse-alphabetical"', () => {
    const items = ['zebra', 'apple', 'monkey', 'banana'];
    const result = sortArrayItems(items, 'reverse-alphabetical');
    expect(result).toEqual(['zebra', 'monkey', 'banana', 'apple']);
  });

  test('should keep non-numbers in original order when using number sort modes', () => {
    const items = ['a', 'b', 'c'];
    const ascResult = sortArrayItems(items, 'ascending');
    const descResult = sortArrayItems(items, 'descending');
    expect(ascResult).toEqual(items);
    expect(descResult).toEqual(items);
  });

  test('should handle mixed types with alphabetical sort', () => {
    const items = [3, 'apple', 1, 'zebra', 2];
    const result = sortArrayItems(items, 'alphabetical');
    // All items are converted to strings for comparison
    expect(result).toEqual([1, 2, 3, 'apple', 'zebra']);
  });
});

describe('getObjectKeySortLabel', () => {
  test('should return correct labels for each mode', () => {
    expect(getObjectKeySortLabel('original')).toBe('Original Order');
    expect(getObjectKeySortLabel('alphabetical')).toBe('A → Z');
    expect(getObjectKeySortLabel('reverse-alphabetical')).toBe('Z → A');
  });
});

describe('getArrayItemSortLabel', () => {
  test('should return correct labels for each mode', () => {
    expect(getArrayItemSortLabel('original')).toBe('Original Order');
    expect(getArrayItemSortLabel('ascending')).toBe('Ascending (Numbers)');
    expect(getArrayItemSortLabel('descending')).toBe('Descending (Numbers)');
    expect(getArrayItemSortLabel('alphabetical')).toBe('A → Z (All)');
    expect(getArrayItemSortLabel('reverse-alphabetical')).toBe('Z → A (All)');
  });
});
