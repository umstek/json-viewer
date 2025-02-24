import type { Renderer } from './renderer/renderer';
import { createRouter } from './renderer/router';

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
  highlightedPath?: string;
  filterOptions?: FilterOptions;
  searchQuery?: string;
}

export default function PojoViewer({
  data,
  renderers = [],
  highlightedPath,
  filterOptions,
  searchQuery,
}: PojoViewerProps) {
  const router = createRouter(renderers);
  return (
    <div>
      {router(data, [], {
        highlightedPath: highlightedPath?.split('.') || [],
        filterOptions,
        searchQuery,
      })}
    </div>
  );
}
