import type { ReactNode } from 'react';
import type { FilterOptions } from '../pojo-viewer';
import {
  BooleanRenderer,
  NullRenderer,
  NumberRenderer,
  StringRenderer,
} from './common-renderers';
import { createInlineRouter, type InlineRenderer } from './inline-renderer';
import { ArrayRenderer, ObjectRenderer } from './object-renderer';
import type { Renderer } from './renderer';

export interface RouterOptions {
  highlightedPath?: string[];
  filterOptions?: FilterOptions;
  searchQuery?: string;
  inlineRouter?: (value: unknown, path: string[], count?: number) => ReactNode;
}

function isPathMatch(
  currentPath: string[],
  highlightedPath: string[],
): boolean {
  if (!currentPath.length || !highlightedPath.length) return false;
  return currentPath.join('.') === highlightedPath.join('.');
}

/**
 * Creates a router function that will try custom renderers first,
 * then fall back to default renderers.
 */
export function createRouter(
  customRenderers: Renderer[] = [],
  inlineRenderers: InlineRenderer[] = [],
) {
  // Create the inline router once for reuse
  const inlineRouter = createInlineRouter(inlineRenderers);

  return function renderValue(
    value: unknown,
    path: string[] = [],
    options: RouterOptions = {},
  ) {
    const { filterOptions } = options;

    // Pass inline router through options
    const optionsWithInline = { ...options, inlineRouter };

    // Check if the current key is excluded
    if (filterOptions?.excludedKeys.includes(path[path.length - 1] || '')) {
      return null;
    }

    // Try custom renderers first
    for (const renderer of customRenderers) {
      const result = renderer({ value, path });
      if (result !== null) return result;
    }

    const isHighlighted = options.highlightedPath?.length
      ? isPathMatch(path, options.highlightedPath)
      : false;

    const wrapWithHighlight = (element: ReactNode) => {
      if (!isHighlighted) return element;
      return (
        <div className="-mx-2 rounded bg-yellow-100 px-2 dark:bg-yellow-900/30">
          {element}
        </div>
      );
    };

    // Apply type-based filtering
    if (filterOptions) {
      if (typeof value === 'string' && !filterOptions.showStrings) return null;
      if (typeof value === 'number' && !filterOptions.showNumbers) return null;
      if (typeof value === 'boolean' && !filterOptions.showBooleans)
        return null;
      if (value === null && !filterOptions.showNull) return null;
      if (Array.isArray(value) && !filterOptions.showArrays) return null;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !filterOptions.showObjects
      )
        return null;
    }

    // Fall back to default renderers
    if (typeof value === 'string') {
      return wrapWithHighlight(<StringRenderer value={value} />);
    }
    if (typeof value === 'number') {
      return wrapWithHighlight(<NumberRenderer value={value} />);
    }
    if (typeof value === 'boolean') {
      return wrapWithHighlight(<BooleanRenderer value={value} />);
    }
    if (value === null || value === undefined) {
      return wrapWithHighlight(<NullRenderer />);
    }
    if (Array.isArray(value)) {
      return wrapWithHighlight(
        <ArrayRenderer
          value={value}
          router={renderValue}
          path={path}
          options={optionsWithInline}
        />,
      );
    }
    if (typeof value === 'object') {
      return wrapWithHighlight(
        <ObjectRenderer
          value={value}
          router={renderValue}
          path={path}
          options={optionsWithInline}
        />,
      );
    }

    // Fallback for any other types
    return wrapWithHighlight(<pre>{String(value)}</pre>);
  };
}
