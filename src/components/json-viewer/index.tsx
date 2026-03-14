import { useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BreadcrumbNav } from './features/breadcrumbs';
import { ExpansionProvider, useExpansion } from './features/expansion';
import { ExportButton } from './features/export';
import {
  type CustomKeyboardShortcut,
  ShortcutsHelp,
  useKeyboardNavigation,
} from './features/keyboard';
import { useParsedJson } from './hooks/use-parsed-json';
import { useSchemaValidation } from './hooks/use-schema-validation';
import { useSearch } from './hooks/use-search';
import type { FilterOptions } from './pojo-viewer';
import PojoViewer from './pojo-viewer';
import type { CodeRendererOptions } from './renderer/advanced/code';
import { createCodeRenderer } from './renderer/advanced/code';
import type { DateRendererOptions } from './renderer/advanced/date';
import { createDateRenderer } from './renderer/advanced/date';
import { createLinkRenderer } from './renderer/advanced/link';
import {
  createSchemaValidationRenderer,
  ValidationErrorPanel,
} from './renderer/advanced/schema-validation';
import { createActionableRenderer } from './renderer/advanced/validation';
import type { InlineRenderer } from './renderer/inline-renderer';
import type { Renderer } from './renderer/renderer';
import type { JSONSchemaObject, JSONSchemaValidationOptions } from './schema/json-schema';
import { FilterControls, FilterPopoverContent } from './toolbar/filter-controls';
import { SearchBar } from './toolbar/search-bar';
import { SortControls, SortPopoverContent } from './toolbar/sort-controls';
import type { SortOptions } from './utils/sorting';
import { defaultSortOptions } from './utils/sorting';
import type { Transformer } from './utils/transforms';

export interface JsonViewerProps {
  json: string;
  renderers?: Renderer[];
  inlineRenderers?: InlineRenderer[];
  dateOptions?: DateRendererOptions;
  codeOptions?: CodeRendererOptions;
  transformers?: Transformer[];
  showThemeToggle?: boolean;
  enableValidation?: boolean;
  jsonSchema?: JSONSchemaObject;
  jsonSchemaOptions?: JSONSchemaValidationOptions;
  showValidationErrors?: boolean;
  keyboardShortcuts?: boolean;
  customShortcuts?: CustomKeyboardShortcut[];
}

const defaultFilterOptions: FilterOptions = {
  showStrings: true,
  showNumbers: true,
  showBooleans: true,
  showNull: true,
  showObjects: true,
  showArrays: true,
  excludedKeys: [],
};

/**
 * A component that renders a JSON value as a tree of JSX elements.
 *
 * Will render the given JSON string as a tree of JSX elements.
 * If the given string is not valid JSON, will render an error message.
 *
 * @param {string} json - The JSON string to render.
 *
 * @returns A JSX tree, or an error message if the JSON is invalid.
 */
function JsonViewerContent({
  json,
  renderers: customRenderers = [],
  inlineRenderers = [],
  dateOptions,
  codeOptions,
  transformers = [],
  showThemeToggle = false,
  enableValidation = false,
  jsonSchema,
  jsonSchemaOptions,
  showValidationErrors = true,
  keyboardShortcuts = true,
  customShortcuts,
}: JsonViewerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const { data, error } = useParsedJson(json);

  const schemaValidation = useSchemaValidation(data, jsonSchema, jsonSchemaOptions);

  const { searchState, handleSearch, navigateResults, navigateToPath } = useSearch(data);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [excludeKeyInput, setExcludeKeyInput] = useState('');
  const [sortOptions, setSortOptions] = useState<SortOptions>(defaultSortOptions);

  const expansion = useExpansion();

  const keyboard = useKeyboardNavigation(data, {
    enabled: keyboardShortcuts,
    customShortcuts,
    onFocusChange: (path) => {
      if (path) {
        navigateToPath(path);
      }
    },
    onToggleExpand: (path) => {
      expansion.toggleExpanded(path);
    },
    onCopy: () => {
      console.log('Value copied to clipboard');
    },
    searchInputRef,
    exportButtonRef,
  });

  const builtInRenderers: Renderer[] = [
    createCodeRenderer(codeOptions),
    createDateRenderer(dateOptions),
    createLinkRenderer(),
  ];

  if (jsonSchema && schemaValidation && !schemaValidation.valid) {
    builtInRenderers.push(
      createSchemaValidationRenderer({
        validationErrors: schemaValidation.errors,
        showErrors: showValidationErrors,
      }),
    );
  }

  if (enableValidation) {
    builtInRenderers.push(createActionableRenderer());
  }

  const renderers = [...customRenderers, ...builtInRenderers];

  const handleFilterChange = (key: keyof Omit<FilterOptions, 'excludedKeys'>) => {
    setFilterOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddExcludedKey = () => {
    if (!excludeKeyInput) return;
    setFilterOptions((prev) => ({
      ...prev,
      excludedKeys: [...prev.excludedKeys, excludeKeyInput],
    }));
    setExcludeKeyInput('');
  };

  const handleRemoveExcludedKey = (key: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      excludedKeys: prev.excludedKeys.filter((k) => k !== key),
    }));
  };

  const handleObjectKeySortChange = (mode: string) => {
    setSortOptions((prev) => ({
      ...prev,
      objectKeySort: mode as SortOptions['objectKeySort'],
    }));
  };

  const handleArrayItemSortChange = (mode: string) => {
    setSortOptions((prev) => ({
      ...prev,
      arrayItemSort: mode as SortOptions['arrayItemSort'],
    }));
  };

  if (error) {
    return <div>Invalid JSON: {error.message}</div>;
  }

  return (
    <div ref={keyboard.containerRef} className="w-full space-y-4 overflow-hidden">
      {jsonSchema && schemaValidation && showValidationErrors && (
        <ValidationErrorPanel errors={schemaValidation.errors} />
      )}
      <div className="flex items-center gap-2">
        <SearchBar
          searchState={searchState}
          onSearch={handleSearch}
          onNavigatePrev={() => navigateResults('prev')}
          onNavigateNext={() => navigateResults('next')}
          inputRef={searchInputRef}
        />
        {showThemeToggle && <ExportButton data={data} filename="json-data" ref={exportButtonRef} />}
        {keyboardShortcuts && (
          <button
            type="button"
            onClick={() => keyboard.setShowHelp(true)}
            className="focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground border-input bg-background inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
            aria-label="Keyboard shortcuts"
          >
            <span className="text-xs font-bold">⌘K</span>
          </button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <SortControls
              sortOptions={sortOptions}
              onObjectKeySortChange={handleObjectKeySortChange}
              onArrayItemSortChange={handleArrayItemSortChange}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <SortPopoverContent
              sortOptions={sortOptions}
              onObjectKeySortChange={handleObjectKeySortChange}
              onArrayItemSortChange={handleArrayItemSortChange}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <FilterControls
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              excludeKeyInput={excludeKeyInput}
              onExcludeKeyInputChange={setExcludeKeyInput}
              onAddExcludedKey={handleAddExcludedKey}
              onRemoveExcludedKey={handleRemoveExcludedKey}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              excludeKeyInput={excludeKeyInput}
              onExcludeKeyInputChange={setExcludeKeyInput}
              onAddExcludedKey={handleAddExcludedKey}
              onRemoveExcludedKey={handleRemoveExcludedKey}
            />
          </PopoverContent>
        </Popover>
      </div>
      {searchState.results.length > 0 && searchState.results[searchState.currentResultIndex] && (
        <BreadcrumbNav
          path={searchState.results[searchState.currentResultIndex].path}
          onNavigate={navigateToPath}
          className="bg-muted/50 rounded-md px-1 py-2"
        />
      )}
      <PojoViewer
        data={data}
        renderers={renderers}
        inlineRenderers={inlineRenderers}
        transformers={transformers}
        highlightedPath={searchState.results[searchState.currentResultIndex]?.path || []}
        filterOptions={filterOptions}
        searchQuery={searchState.queryType === 'text' ? searchState.query : ''}
        sortOptions={sortOptions}
        focusedPath={keyboard.focusState.focusedPath}
      />
      {keyboardShortcuts && (
        <ShortcutsHelp
          open={keyboard.showHelp}
          onOpenChange={keyboard.setShowHelp}
          shortcuts={keyboard.shortcuts}
        />
      )}
    </div>
  );
}

export default function JsonViewer(props: JsonViewerProps) {
  return (
    <ExpansionProvider>
      <JsonViewerContent {...props} />
    </ExpansionProvider>
  );
}
