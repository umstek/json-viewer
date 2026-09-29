import { useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BreadcrumbNav } from './features/breadcrumbs';
import { type EditHistoryController, UndoRedoControls } from './features/editor';
import { ExpansionProvider, useExpansion } from './features/expansion';
import { ExportButton } from './features/export';
import { type ContextMenuOptions } from './features/context-menu';
import {
  type CustomKeyboardShortcut,
  ShortcutsHelp,
  useKeyboardNavigation,
} from './features/keyboard';
import { OptionalThemeProvider, ThemeToggle } from './features/theme';
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
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
  /** Renders the Undo/Redo controls and wires their shortcuts; independent of `editable`. */
  editHistory?: EditHistoryController;
  contextMenu?: ContextMenuOptions;
  /** Keys are RFC 6901 JSON Pointer strings (via `pathArrayToJsonPointer`). */
  bookmarkedPaths?: Set<string>;
  /** Explicitly focused node; wins until the user navigates with the keyboard. */
  focusedPath?: string[] | null;
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

// Mirrors the platform formatting used in the shortcuts help dialog.
const isMacPlatform =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const HELP_BUTTON_LABEL = isMacPlatform ? '⌘K' : 'Ctrl+K';

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
  editable,
  onChange,
  readOnly,
  editHistory,
  contextMenu,
  bookmarkedPaths,
  focusedPath,
}: JsonViewerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const { data, error } = useParsedJson(json);

  const schemaValidation = useSchemaValidation(data, jsonSchema, jsonSchemaOptions);

  const { searchState, handleSearch, navigateResults, navigateToPath } = useSearch(data);

  // Keyboard-driven focus from the most recent interaction; takes precedence
  // over the focusedPath prop once the user starts navigating with arrows.
  const [keyboardFocus, setKeyboardFocus] = useState<string[] | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [excludeKeyInput, setExcludeKeyInput] = useState('');
  const [sortOptions, setSortOptions] = useState<SortOptions>(defaultSortOptions);

  const expansion = useExpansion();

  const keyboard = useKeyboardNavigation(data, {
    enabled: keyboardShortcuts,
    customShortcuts,
    // Keyboard focus must not flow through the search pipeline: routing it
    // through navigateToPath would replace the user's query and results on
    // every arrow press. The focus ring is rendered from focusedPath below.
    onFocusChange: setKeyboardFocus,
    onToggleExpand: (path, direction) => {
      if (direction === 'toggle') {
        expansion.toggleExpanded(path);
      } else {
        expansion.setExpanded(path, direction === 'expand');
      }
    },
    onClearSearch: () => {
      handleSearch('');
    },
    onCopy: () => {
      console.log('Value copied to clipboard');
    },
    onUndo: editHistory?.undo,
    onRedo: editHistory?.redo,
    searchInputRef,
    exportButtonRef,
  });

  // Validation renderers run before the cosmetic built-ins so an invalid
  // value that happens to look like a link, date, or code block still shows
  // its error indicator instead of being silently claimed first.
  const builtInRenderers: Renderer[] = [];

  if (jsonSchema && schemaValidation && !schemaValidation.valid) {
    builtInRenderers.push(
      createSchemaValidationRenderer({
        validationErrors: schemaValidation.errors,
        showErrors: showValidationErrors,
      }),
    );
  }

  builtInRenderers.push(
    createCodeRenderer(codeOptions),
    createDateRenderer(dateOptions),
    createLinkRenderer(),
  );

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
        {editHistory && <UndoRedoControls history={editHistory} />}
        <ExportButton data={data} filename="json-data" ref={exportButtonRef} />
        {showThemeToggle && <ThemeToggle />}
        {keyboardShortcuts && (
          <button
            type="button"
            onClick={() => keyboard.setShowHelp(true)}
            className="focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground border-input bg-background inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
            aria-label="Keyboard shortcuts"
          >
            <span className="text-xs font-bold">{HELP_BUTTON_LABEL}</span>
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
        focusedPath={keyboardFocus ?? focusedPath ?? keyboard.focusState.focusedPath}
        editable={editable}
        onChange={onChange}
        readOnly={readOnly}
        contextMenu={contextMenu}
        bookmarkedPaths={bookmarkedPaths}
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
      <OptionalThemeProvider>
        <JsonViewerContent {...props} />
      </OptionalThemeProvider>
    </ExpansionProvider>
  );
}
