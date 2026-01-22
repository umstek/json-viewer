import type { VirtualItem } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useOptionalExpansion } from '../features/expansion';
import { sortArrayItems, sortObjectEntries } from '../utils/sorting';
import { CopyButton } from './copy-button';
import type { RouterOptions } from './router';

const VIRTUALIZATION_THRESHOLD = 50; // Only virtualize if more than 50 items

interface ObjectRendererProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy code
  value: any;
  router: (value: unknown, path: string[], options: RouterOptions) => ReactNode;
  path: string[];
  options: RouterOptions;
}

interface HighlightTextProps {
  text: string;
  searchQuery?: string;
}

function HighlightText({ text, searchQuery }: HighlightTextProps) {
  if (!searchQuery) return <>{text}</>;

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === searchQuery?.toLowerCase();
        return isMatch ? (
          <span
            key={`${part}-${i}-${text}`}
            className="rounded bg-yellow-100 px-1 dark:bg-yellow-900/30"
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${i}-${text}`}>{part}</span>
        );
      })}
    </>
  );
}

function isPathAncestor(currentPath: string, targetPath: string): boolean {
  if (!currentPath || !targetPath) return false;
  if (currentPath === targetPath) return true;

  const currentParts = currentPath.split('.');
  const targetParts = targetPath.split('.');

  // Check if current path is a prefix of target path
  return targetParts.slice(0, currentParts.length).join('.') === currentPath;
}

export function ObjectRenderer({
  value,
  router,
  path,
  options,
}: ObjectRendererProps) {
  const currentPath = path.join('.');
  const expansionContext = useOptionalExpansion();

  // Use context-based expansion if available, otherwise use local state
  const [localIsOpen, setLocalIsOpen] = useState(false);

  const isOpen = expansionContext
    ? expansionContext.isExpanded(currentPath)
    : localIsOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (expansionContext) {
        expansionContext.setExpanded(currentPath, open);
      } else {
        setLocalIsOpen(open);
      }
    },
    [expansionContext, currentPath],
  );
  const parentRef = useRef<HTMLDivElement>(null);

  // Lazy loading logic
  const {
    currentDepth = 0,
    maxInitialDepth = 3,
    lazyLoadingEnabled = true,
  } = options;
  const shouldLazyLoad =
    lazyLoadingEnabled && currentDepth >= maxInitialDepth && !isOpen;

  // Memoize entries and filtering to avoid unnecessary recalculations
  const { filteredEntries, shouldVirtualize } = useMemo(() => {
    const entries = Object.entries(value);
    const filtered = entries.filter(([key, val]) => {
      // Check if key is excluded
      if (options.filterOptions?.excludedKeys.includes(key)) {
        return false;
      }

      // Check value type
      if (options.filterOptions) {
        if (typeof val === 'string' && !options.filterOptions.showStrings)
          return false;
        if (typeof val === 'number' && !options.filterOptions.showNumbers)
          return false;
        if (typeof val === 'boolean' && !options.filterOptions.showBooleans)
          return false;
        if (val === null && !options.filterOptions.showNull) return false;
        if (Array.isArray(val) && !options.filterOptions.showArrays)
          return false;
        if (
          typeof val === 'object' &&
          val !== null &&
          !Array.isArray(val) &&
          !options.filterOptions.showObjects
        )
          return false;
      }

      return true;
    });

    // Apply sorting
    const sorted = options.sortOptions?.objectKeySort
      ? sortObjectEntries(filtered, options.sortOptions.objectKeySort)
      : filtered;

    return {
      filteredEntries: sorted,
      shouldVirtualize: sorted.length > VIRTUALIZATION_THRESHOLD,
    };
  }, [value, options.filterOptions, options.sortOptions]);

  // Auto-expand if this path is part of the highlighted path
  useEffect(() => {
    if (options.highlightedPath?.length) {
      const highlightedPath = options.highlightedPath.join('.');
      if (isPathAncestor(currentPath, highlightedPath)) {
        setIsOpen(true);
      }
    }
  }, [options.highlightedPath, currentPath, setIsOpen]);

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30, // Estimate each row height
    overscan: 5, // Number of items to render outside of the viewport
  });

  if (filteredEntries.length === 0) {
    return null;
  }

  const renderVirtualRow = (virtualRow: VirtualItem) => {
    const [key, val] = filteredEntries[virtualRow.index];
    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={virtualizer.measureElement}
        className="absolute top-0 left-0 w-full overflow-hidden"
        style={{
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <div className="flex w-full min-w-0 gap-2">
          <span className="whitespace-nowrap text-primary">
            <HighlightText text={`${key}:`} searchQuery={options.searchQuery} />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            {router(val, [...path, key], options)}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Show placeholder if lazy loading is active
    if (shouldLazyLoad) {
      return (
        <div className="text-muted-foreground text-sm italic">
          Expand to load {filteredEntries.length} items (depth {currentDepth})
        </div>
      );
    }

    if (!shouldVirtualize) {
      return filteredEntries.map(([key, val]: [string, unknown]) => (
        <div
          key={`${path.join('.')}.${key}`}
          className="flex w-full min-w-0 gap-2"
        >
          <span className="whitespace-nowrap text-primary">
            <HighlightText text={`${key}:`} searchQuery={options.searchQuery} />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            {router(val, [...path, key], options)}
          </div>
        </div>
      ));
    }

    return (
      <div
        ref={parentRef}
        className="scrollbar-custom w-full overflow-auto rounded-md pr-2"
        style={{
          maxHeight: '400px',
          minHeight: Math.min(400, filteredEntries.length * 30),
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(renderVirtualRow)}
        </div>
      </div>
    );
  };

  // Render inline preview when collapsed
  const inlinePreview =
    !isOpen && options.inlineRouter
      ? options.inlineRouter(value, path, filteredEntries.length)
      : `{...${filteredEntries.length} items}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center gap-1">
        <CollapsibleTrigger>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </CollapsibleTrigger>
        <span className="text-muted-foreground">
          {isOpen ? '{' : inlinePreview}
        </span>
        <CopyButton value={value} />
      </div>
      <CollapsibleContent>
        <div className="ml-4 w-full">{renderContent()}</div>
        <span className="text-muted-foreground">{'}'}</span>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ArrayRenderer({
  value,
  router,
  path,
  options,
}: ObjectRendererProps) {
  const currentPath = path.join('.');
  const expansionContext = useOptionalExpansion();
  const parentRef = useRef<HTMLDivElement>(null);

  // Use context-based expansion if available, otherwise use local state
  const [localIsOpen, setLocalIsOpen] = useState(false);

  const isOpen = expansionContext
    ? expansionContext.isExpanded(currentPath)
    : localIsOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (expansionContext) {
        expansionContext.setExpanded(currentPath, open);
      } else {
        setLocalIsOpen(open);
      }
    },
    [expansionContext, currentPath],
  );

  // Lazy loading logic
  const {
    currentDepth = 0,
    maxInitialDepth = 3,
    lazyLoadingEnabled = true,
  } = options;
  const shouldLazyLoad =
    lazyLoadingEnabled && currentDepth >= maxInitialDepth && !isOpen;

  // Memoize filtering to avoid unnecessary recalculations
  const { filteredItems, shouldVirtualize } = useMemo(() => {
    const filtered = value.filter((val: unknown) => {
      if (options.filterOptions) {
        if (typeof val === 'string' && !options.filterOptions.showStrings)
          return false;
        if (typeof val === 'number' && !options.filterOptions.showNumbers)
          return false;
        if (typeof val === 'boolean' && !options.filterOptions.showBooleans)
          return false;
        if (val === null && !options.filterOptions.showNull) return false;
        if (Array.isArray(val) && !options.filterOptions.showArrays)
          return false;
        if (
          typeof val === 'object' &&
          val !== null &&
          !Array.isArray(val) &&
          !options.filterOptions.showObjects
        )
          return false;
      }
      return true;
    });

    // Apply sorting
    const sorted = options.sortOptions?.arrayItemSort
      ? sortArrayItems(filtered, options.sortOptions.arrayItemSort)
      : filtered;

    return {
      filteredItems: sorted,
      shouldVirtualize: sorted.length > VIRTUALIZATION_THRESHOLD,
    };
  }, [value, options.filterOptions, options.sortOptions]);

  // Auto-expand if this path is part of the highlighted path
  useEffect(() => {
    if (options.highlightedPath?.length) {
      const highlightedPath = options.highlightedPath.join('.');
      if (isPathAncestor(currentPath, highlightedPath)) {
        setIsOpen(true);
      }
    }
  }, [options.highlightedPath, currentPath, setIsOpen]);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 5,
  });

  if (filteredItems.length === 0) {
    return null;
  }

  const renderVirtualRow = (virtualRow: VirtualItem) => {
    const val = filteredItems[virtualRow.index];
    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={virtualizer.measureElement}
        className="absolute top-0 left-0 w-full overflow-hidden"
        style={{
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <div className="flex w-full min-w-0 gap-2">
          <span className="whitespace-nowrap text-primary">
            <HighlightText
              text={`${virtualRow.index}:`}
              searchQuery={options.searchQuery}
            />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            {router(val, [...path, String(virtualRow.index)], options)}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Show placeholder if lazy loading is active
    if (shouldLazyLoad) {
      return (
        <div className="text-muted-foreground text-sm italic">
          Expand to load {filteredItems.length} items (depth {currentDepth})
        </div>
      );
    }

    if (!shouldVirtualize) {
      return filteredItems.map((val: unknown, index: number) => (
        <div
          key={`${path.join('.')}.${index}`}
          className="flex w-full min-w-0 gap-2"
        >
          <span className="whitespace-nowrap text-primary">
            <HighlightText
              text={`${index}:`}
              searchQuery={options.searchQuery}
            />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            {router(val, [...path, String(index)], options)}
          </div>
        </div>
      ));
    }

    return (
      <div
        ref={parentRef}
        className="scrollbar-custom w-full overflow-auto rounded-md pr-2"
        style={{
          maxHeight: '400px',
          minHeight: Math.min(400, filteredItems.length * 30),
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(renderVirtualRow)}
        </div>
      </div>
    );
  };

  // Render inline preview when collapsed
  const inlinePreview =
    !isOpen && options.inlineRouter
      ? options.inlineRouter(value, path, filteredItems.length)
      : `[...${filteredItems.length} items]`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center gap-1">
        <CollapsibleTrigger>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </CollapsibleTrigger>
        <span className="text-muted-foreground">
          {isOpen ? '[' : inlinePreview}
        </span>
        <CopyButton value={value} />
      </div>
      <CollapsibleContent>
        <div className="ml-4 w-full">{renderContent()}</div>
        <span className="text-muted-foreground">{']'}</span>
      </CollapsibleContent>
    </Collapsible>
  );
}
