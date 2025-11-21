/**
 * Diff utility for comparing two JSON structures
 */

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffResult {
  type: DiffType;
  path: string[];
  leftValue?: unknown;
  rightValue?: unknown;
  children?: DiffNode[];
}

export interface DiffNode extends DiffResult {
  key?: string | number;
}

export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

/**
 * Compare two values and determine if they are equal
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}

/**
 * Compute diff between two values
 */
export function computeDiff(
  left: unknown,
  right: unknown,
  path: string[] = [],
): DiffResult {
  // Handle null/undefined cases
  if (left === undefined && right === undefined) {
    return { type: 'unchanged', path, leftValue: left, rightValue: right };
  }

  if (left === undefined) {
    return { type: 'added', path, rightValue: right };
  }

  if (right === undefined) {
    return { type: 'removed', path, leftValue: left };
  }

  // Check if values are equal
  if (deepEqual(left, right)) {
    return { type: 'unchanged', path, leftValue: left, rightValue: right };
  }

  // Handle arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    return computeArrayDiff(left, right, path);
  }

  // Handle objects
  if (
    typeof left === 'object' &&
    left !== null &&
    typeof right === 'object' &&
    right !== null &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    return computeObjectDiff(
      left as Record<string, unknown>,
      right as Record<string, unknown>,
      path,
    );
  }

  // Primitive values that are different
  return { type: 'modified', path, leftValue: left, rightValue: right };
}

/**
 * Compute diff for arrays
 */
function computeArrayDiff(
  left: unknown[],
  right: unknown[],
  path: string[],
): DiffResult {
  const children: DiffNode[] = [];
  const maxLength = Math.max(left.length, right.length);

  for (let i = 0; i < maxLength; i++) {
    const leftItem = i < left.length ? left[i] : undefined;
    const rightItem = i < right.length ? right[i] : undefined;

    const itemDiff = computeDiff(leftItem, rightItem, [...path, String(i)]);
    children.push({
      ...itemDiff,
      key: i,
    });
  }

  // Determine overall type
  const hasChanges = children.some((child) => child.type !== 'unchanged');
  const type: DiffType = hasChanges ? 'modified' : 'unchanged';

  return {
    type,
    path,
    leftValue: left,
    rightValue: right,
    children,
  };
}

/**
 * Compute diff for objects
 */
function computeObjectDiff(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  path: string[],
): DiffResult {
  const children: DiffNode[] = [];
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of allKeys) {
    const leftValue = left[key];
    const rightValue = right[key];

    const itemDiff = computeDiff(leftValue, rightValue, [...path, key]);
    children.push({
      ...itemDiff,
      key,
    });
  }

  // Sort children by key for consistent ordering
  children.sort((a, b) => {
    const keyA = String(a.key ?? '');
    const keyB = String(b.key ?? '');
    return keyA.localeCompare(keyB);
  });

  // Determine overall type
  const hasChanges = children.some((child) => child.type !== 'unchanged');
  const type: DiffType = hasChanges ? 'modified' : 'unchanged';

  return {
    type,
    path,
    leftValue: left,
    rightValue: right,
    children,
  };
}

/**
 * Calculate statistics from a diff result
 */
export function calculateDiffStats(diff: DiffResult): DiffStats {
  const stats: DiffStats = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  };

  function traverse(node: DiffResult) {
    // Count leaf nodes only (nodes without children or with primitive values)
    if (!node.children || node.children.length === 0) {
      stats[node.type]++;
    } else {
      // For container nodes, only count if they represent a type change
      if (node.type === 'added' || node.type === 'removed') {
        stats[node.type]++;
      }
      // Traverse children
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(diff);
  return stats;
}

/**
 * Flatten diff tree into a list of changes (for easier processing)
 */
export function flattenDiff(diff: DiffResult): DiffNode[] {
  const result: DiffNode[] = [];

  function traverse(node: DiffResult) {
    if (node.type !== 'unchanged' || !node.children) {
      result.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(diff);
  return result;
}

/**
 * Filter diff to only show changes (remove unchanged nodes)
 */
export function filterUnchanged(diff: DiffResult): DiffResult | null {
  if (diff.type !== 'unchanged') {
    if (diff.children) {
      const filteredChildren = diff.children
        .map((child) => filterUnchanged(child))
        .filter((child): child is DiffNode => child !== null);

      return {
        ...diff,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    }
    return diff;
  }

  if (diff.children) {
    const filteredChildren = diff.children
      .map((child) => filterUnchanged(child))
      .filter((child): child is DiffNode => child !== null);

    if (filteredChildren.length > 0) {
      return {
        ...diff,
        children: filteredChildren,
      };
    }
  }

  return null;
}
