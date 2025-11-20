import type { ReactNode } from 'react';

/**
 * Props passed to inline renderers
 */
export interface InlineRenderProps {
  value: unknown;
  path: string[];
  /**
   * The number of items/properties (for arrays and objects)
   */
  count?: number;
}

/**
 * An inline renderer is a function that returns a compact representation
 * of a value when collapsed. It should return null if it cannot render
 * the value, allowing other renderers to try.
 */
export type InlineRenderer = (props: InlineRenderProps) => ReactNode;

/**
 * Default threshold for showing full inline preview vs count
 */
const INLINE_PREVIEW_THRESHOLD = 3;

/**
 * Maximum string length to show before truncating
 */
const MAX_STRING_LENGTH = 50;

/**
 * Default inline renderer for arrays
 * Shows [1, 2, 3] for small arrays or [5 items] for larger ones
 */
export function defaultArrayInlineRenderer(
  props: InlineRenderProps,
): ReactNode {
  const { value, count } = props;

  if (!Array.isArray(value)) return null;

  const itemCount = count ?? value.length;

  // Show full preview for small arrays
  if (itemCount <= INLINE_PREVIEW_THRESHOLD && itemCount > 0) {
    const preview = value
      .slice(0, INLINE_PREVIEW_THRESHOLD)
      .map((item) => {
        if (typeof item === 'string') return `"${item}"`;
        if (typeof item === 'number') return String(item);
        if (typeof item === 'boolean') return String(item);
        if (item === null) return 'null';
        if (typeof item === 'object')
          return Array.isArray(item) ? '[...]' : '{...}';
        return String(item);
      })
      .join(', ');
    return `[${preview}]`;
  }

  // Show count for larger arrays
  return `[${itemCount} ${itemCount === 1 ? 'item' : 'items'}]`;
}

/**
 * Default inline renderer for objects
 * Shows {name: "...", age: 25} for small objects or {3 properties} for larger ones
 */
export function defaultObjectInlineRenderer(
  props: InlineRenderProps,
): ReactNode {
  const { value, count } = props;

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);
  const propertyCount = count ?? entries.length;

  // Show preview for small objects
  if (propertyCount <= INLINE_PREVIEW_THRESHOLD && propertyCount > 0) {
    const preview = entries
      .slice(0, INLINE_PREVIEW_THRESHOLD)
      .map(([key, val]) => {
        let valueStr = '';
        if (typeof val === 'string') valueStr = `"${val}"`;
        else if (typeof val === 'number') valueStr = String(val);
        else if (typeof val === 'boolean') valueStr = String(val);
        else if (val === null) valueStr = 'null';
        else if (typeof val === 'object')
          valueStr = Array.isArray(val) ? '[...]' : '{...}';
        else valueStr = String(val);

        return `${key}: ${valueStr}`;
      })
      .join(', ');
    return `{${preview}}`;
  }

  // Show count for larger objects
  return `{${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}}`;
}

/**
 * Default inline renderer for strings
 * Truncates long strings with ellipsis
 */
export function defaultStringInlineRenderer(
  props: InlineRenderProps,
): ReactNode {
  const { value } = props;

  if (typeof value !== 'string') return null;

  if (value.length > MAX_STRING_LENGTH) {
    return `"${value.slice(0, MAX_STRING_LENGTH)}..."`;
  }

  return `"${value}"`;
}

/**
 * Creates a router function for inline renderers
 * Tries custom renderers first, then falls back to defaults
 */
export function createInlineRouter(customRenderers: InlineRenderer[] = []) {
  // Default renderers
  const defaultRenderers = [
    defaultArrayInlineRenderer,
    defaultObjectInlineRenderer,
    defaultStringInlineRenderer,
  ];

  return function renderInline(
    value: unknown,
    path: string[] = [],
    count?: number,
  ): ReactNode {
    const props: InlineRenderProps = { value, path, count };

    // Try custom renderers first
    for (const renderer of customRenderers) {
      const result = renderer(props);
      if (result !== null) return result;
    }

    // Try default renderers
    for (const renderer of defaultRenderers) {
      const result = renderer(props);
      if (result !== null) return result;
    }

    // Fallback: just return a simple string representation
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (value === null) return 'null';
    if (Array.isArray(value)) return '[...]';
    if (typeof value === 'object') return '{...}';
    return String(value);
  };
}
