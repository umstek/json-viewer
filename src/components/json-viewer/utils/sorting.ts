/**
 * Sorting utilities for JSON viewer
 * Provides functions to sort object keys and array items
 */

export type ObjectKeySortMode = 'original' | 'alphabetical' | 'reverse-alphabetical';
export type ArrayItemSortMode =
  | 'original'
  | 'ascending'
  | 'descending'
  | 'alphabetical'
  | 'reverse-alphabetical';

export interface SortOptions {
  objectKeySort: ObjectKeySortMode;
  arrayItemSort: ArrayItemSortMode;
}

export interface ArrayItemWithSource {
  sourceIndex: number;
  value: unknown;
}

export const defaultSortOptions: SortOptions = {
  objectKeySort: 'original',
  arrayItemSort: 'original',
};

/**
 * Sorts object entries based on the specified sort mode
 */
export function sortObjectEntries(
  entries: [string, unknown][],
  sortMode: ObjectKeySortMode,
): [string, unknown][] {
  if (sortMode === 'original') {
    return entries;
  }

  const sorted = [...entries];

  if (sortMode === 'alphabetical') {
    sorted.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  } else if (sortMode === 'reverse-alphabetical') {
    sorted.sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
  }

  return sorted;
}

/**
 * Sorts array items based on the specified sort mode
 */
export function sortArrayItems(items: unknown[], sortMode: ArrayItemSortMode): unknown[] {
  if (sortMode === 'original') {
    return items;
  }

  const sorted = [...items];
  sorted.sort((a, b) => compareArrayValues(a, b, sortMode));

  return sorted;
}

export function sortArrayItemsWithSource(
  items: ArrayItemWithSource[],
  sortMode: ArrayItemSortMode,
): ArrayItemWithSource[] {
  if (sortMode === 'original') {
    return items;
  }

  const sorted = [...items];
  sorted.sort((a, b) => compareArrayValues(a.value, b.value, sortMode));
  return sorted;
}

function compareArrayValues(a: unknown, b: unknown, sortMode: ArrayItemSortMode): number {
  if (sortMode === 'ascending') {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return 0;
  }

  if (sortMode === 'descending') {
    if (typeof a === 'number' && typeof b === 'number') {
      return b - a;
    }
    return 0;
  }

  if (sortMode === 'alphabetical') {
    return String(a).localeCompare(String(b));
  }

  if (sortMode === 'reverse-alphabetical') {
    return String(b).localeCompare(String(a));
  }

  return 0;
}

/**
 * Gets a human-readable label for the object key sort mode
 */
export function getObjectKeySortLabel(sortMode: ObjectKeySortMode): string {
  switch (sortMode) {
    case 'original':
      return 'Original Order';
    case 'alphabetical':
      return 'A → Z';
    case 'reverse-alphabetical':
      return 'Z → A';
    default:
      return 'Original Order';
  }
}

/**
 * Gets a human-readable label for the array item sort mode
 */
export function getArrayItemSortLabel(sortMode: ArrayItemSortMode): string {
  switch (sortMode) {
    case 'original':
      return 'Original Order';
    case 'ascending':
      return 'Ascending (Numbers)';
    case 'descending':
      return 'Descending (Numbers)';
    case 'alphabetical':
      return 'A → Z (All)';
    case 'reverse-alphabetical':
      return 'Z → A (All)';
    default:
      return 'Original Order';
  }
}
