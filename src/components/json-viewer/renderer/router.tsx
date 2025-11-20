import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FilterOptions } from '../pojo-viewer';
import type { SortOptions } from '../utils/sorting';
import { applyTransformers, type Transformer } from '../utils/transforms';
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
  sortOptions?: SortOptions;
  inlineRouter?: (value: unknown, path: string[], count?: number) => ReactNode;
  currentDepth?: number;
  maxInitialDepth?: number;
  lazyLoadingEnabled?: boolean;
  bookmarkedPaths?: Set<string>;
  editable?: boolean;
  schema?: Record<string, unknown>;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
  focusedPath?: string[] | null;
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
  transformers: Transformer[] = [],
) {
  // Create the inline router once for reuse
  const inlineRouter = createInlineRouter(inlineRenderers);

  return function renderValue(
    value: unknown,
    path: string[] = [],
    options: RouterOptions = {},
  ) {
    const { filterOptions, currentDepth = 0 } = options;

    // Apply transformations to the value before rendering
    // This ensures transformations don't modify the original data
    const transformedValue = applyTransformers(value, path, transformers);

    // Pass inline router and incremented depth through options
    const optionsWithInline = {
      ...options,
      inlineRouter,
      currentDepth: currentDepth + 1,
    };

    // Check if the current key is excluded
    if (filterOptions?.excludedKeys.includes(path[path.length - 1] || '')) {
      return null;
    }

    // Try custom renderers first (using transformed value)
    for (const renderer of customRenderers) {
      const result = renderer({ value: transformedValue, path });
      if (result !== null) return result;
    }

    const isHighlighted = options.highlightedPath?.length
      ? isPathMatch(path, options.highlightedPath)
      : false;

    const isBookmarked =
      path.length > 0 && options.bookmarkedPaths?.has(path.join('.'));

    const isFocused = options.focusedPath?.length
      ? isPathMatch(path, options.focusedPath)
      : false;

    const wrapWithHighlight = (element: ReactNode) => {
      const hasIndicator = isHighlighted || isBookmarked || isFocused;
      if (!hasIndicator) return element;

      return (
        <div
          className={`-mx-2 flex items-start gap-1 rounded px-2 ${
            isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''
          } ${
            isFocused
              ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-blue-400'
              : ''
          }`}
          tabIndex={isFocused ? 0 : -1}
          data-focused={isFocused ? 'true' : undefined}
          data-path={isFocused ? path.join('.') : undefined}
        >
          {isBookmarked && (
            <Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <div className="flex-1">{element}</div>
        </div>
      );
    };

    // Apply type-based filtering (using transformed value)
    if (filterOptions) {
      if (typeof transformedValue === 'string' && !filterOptions.showStrings)
        return null;
      if (typeof transformedValue === 'number' && !filterOptions.showNumbers)
        return null;
      if (typeof transformedValue === 'boolean' && !filterOptions.showBooleans)
        return null;
      if (transformedValue === null && !filterOptions.showNull) return null;
      if (Array.isArray(transformedValue) && !filterOptions.showArrays)
        return null;
      if (
        typeof transformedValue === 'object' &&
        transformedValue !== null &&
        !Array.isArray(transformedValue) &&
        !filterOptions.showObjects
      )
        return null;
    }

    // Fall back to default renderers (using transformed value)
    if (typeof transformedValue === 'string') {
      return wrapWithHighlight(
        <StringRenderer
          value={transformedValue}
          path={path}
          editable={options.editable}
          onChange={options.onChange}
          readOnly={options.readOnly}
        />,
      );
    }
    if (typeof transformedValue === 'number') {
      return wrapWithHighlight(
        <NumberRenderer
          value={transformedValue}
          path={path}
          editable={options.editable}
          onChange={options.onChange}
          readOnly={options.readOnly}
        />,
      );
    }
    if (typeof transformedValue === 'boolean') {
      return wrapWithHighlight(
        <BooleanRenderer
          value={transformedValue}
          path={path}
          editable={options.editable}
          onChange={options.onChange}
          readOnly={options.readOnly}
        />,
      );
    }
    if (transformedValue === null || transformedValue === undefined) {
      return wrapWithHighlight(
        <NullRenderer
          path={path}
          editable={options.editable}
          onChange={options.onChange}
          readOnly={options.readOnly}
        />,
      );
    }
    if (Array.isArray(transformedValue)) {
      return wrapWithHighlight(
        <ArrayRenderer
          value={transformedValue}
          router={renderValue}
          path={path}
          options={optionsWithInline}
        />,
      );
    }
    if (typeof transformedValue === 'object') {
      return wrapWithHighlight(
        <ObjectRenderer
          value={transformedValue}
          router={renderValue}
          path={path}
          options={optionsWithInline}
        />,
      );
    }

    // Fallback for any other types
    return wrapWithHighlight(<pre>{String(transformedValue)}</pre>);
  };
}
