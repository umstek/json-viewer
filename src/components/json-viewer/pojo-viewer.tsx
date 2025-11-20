import type { InlineRenderer } from './renderer/inline-renderer';
import type { Renderer } from './renderer/renderer';
import { createRouter } from './renderer/router';
import type { SortOptions } from './utils/sorting';
import type { Transformer } from './utils/transforms';
import type { FormatMapping } from './validation/format-mapping';

export interface FilterOptions {
  showStrings: boolean;
  showNumbers: boolean;
  showBooleans: boolean;
  showNull: boolean;
  showObjects: boolean;
  showArrays: boolean;
  excludedKeys: string[];
}

interface PojoViewerProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy code
  data: any;
  renderers?: Renderer[];
  inlineRenderers?: InlineRenderer[];
  transformers?: Transformer[];
  highlightedPath?: string;
  filterOptions?: FilterOptions;
  searchQuery?: string;
  sortOptions?: SortOptions;
  maxInitialDepth?: number;
  lazyLoadingEnabled?: boolean;
  bookmarkedPaths?: Set<string>;
  editable?: boolean;
  schema?: Record<string, unknown>;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
  focusedPath?: string[] | null;
  formatMappings?: FormatMapping[];
}

export default function PojoViewer({
  data,
  renderers = [],
  inlineRenderers = [],
  transformers = [],
  highlightedPath,
  filterOptions,
  searchQuery,
  sortOptions,
  maxInitialDepth = 3,
  lazyLoadingEnabled = true,
  bookmarkedPaths,
  editable,
  schema,
  onChange,
  readOnly,
  focusedPath,
  formatMappings,
}: PojoViewerProps) {
  const router = createRouter(renderers, inlineRenderers, transformers);
  return (
    <div>
      {router(data, [], {
        highlightedPath: highlightedPath?.split('.') || [],
        filterOptions,
        searchQuery,
        sortOptions,
        currentDepth: 0,
        maxInitialDepth,
        lazyLoadingEnabled,
        bookmarkedPaths,
        editable,
        schema,
        onChange,
        readOnly,
        focusedPath,
        formatMappings,
      })}
    </div>
  );
}
