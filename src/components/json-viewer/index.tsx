import { ArrowDownAZ, Filter, Search } from 'lucide-react';
import {
  type ChangeEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '../ui/button';
import { BreadcrumbNav } from './features/breadcrumbs';
import { ExportButton } from './features/export';
import {
  type CustomKeyboardShortcut,
  ShortcutsHelp,
  ShortcutsHelpButton,
  useKeyboardNavigation,
} from './features/keyboard';
import { ThemeToggle } from './features/theme';
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
import {
  createValidationRenderer,
  type ValidationRendererOptions,
} from './renderer/advanced/validation';
import type {
  JSONSchemaObject,
  JSONSchemaValidationOptions,
} from './schema/json-schema';
import { validateWithJSONSchema } from './schema/json-schema';
import type { ValidationResult } from './schema/types';
import {
  detectQueryType,
  executeQuery,
  pathArrayToJsonPath,
  type QueryResult,
} from './utils/jsonpath';
import {
  type ArrayItemSortMode,
  defaultSortOptions,
  getArrayItemSortLabel,
  getObjectKeySortLabel,
  type ObjectKeySortMode,
  type SortOptions,
} from './utils/sorting';
import type { Transformer } from './utils/transforms';

export interface JsonViewerProps {
  json: string;
  dateOptions?: DateRendererOptions;
  codeOptions?: CodeRendererOptions;
  transformers?: Transformer[];
  showThemeToggle?: boolean;
  enableValidation?: boolean;
  validationOptions?: ValidationRendererOptions;
  jsonSchema?: JSONSchemaObject;
  jsonSchemaOptions?: JSONSchemaValidationOptions;
  showValidationErrors?: boolean;
  keyboardShortcuts?: boolean;
  customShortcuts?: CustomKeyboardShortcut[];
}

interface SearchableObject {
  [key: string]: unknown;
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
export default function JsonViewer({
  json,
  dateOptions,
  codeOptions,
  transformers = [],
  showThemeToggle = false,
  enableValidation = false,
  validationOptions,
  jsonSchema,
  jsonSchemaOptions,
  showValidationErrors = true,
  keyboardShortcuts = true,
  customShortcuts,
}: JsonViewerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Validate JSON data against JSON Schema if provided
  const schemaValidation: ValidationResult | null = useMemo(() => {
    if (!jsonSchema) return null;

    try {
      const data = JSON.parse(json);
      return validateWithJSONSchema(data, jsonSchema, jsonSchemaOptions);
    } catch (_error) {
      // Invalid JSON, return null and let the JSON parsing error handle it
      return null;
    }
  }, [json, jsonSchema, jsonSchemaOptions]);

  const renderers = useMemo(() => {
    const baseRenderers = [
      createCodeRenderer(codeOptions),
      createDateRenderer(dateOptions),
      createLinkRenderer(),
    ];

    // Add JSON Schema validation renderer if schema is provided
    if (jsonSchema && schemaValidation && !schemaValidation.valid) {
      baseRenderers.push(
        createSchemaValidationRenderer({
          validationErrors: schemaValidation.errors,
          showErrors: showValidationErrors,
        }),
      );
    }

    // Add format validation renderer if enabled
    if (enableValidation) {
      baseRenderers.push(createValidationRenderer(validationOptions));
    }

    return baseRenderers;
  }, [
    codeOptions,
    dateOptions,
    enableValidation,
    validationOptions,
    jsonSchema,
    schemaValidation,
    showValidationErrors,
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QueryResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(defaultFilterOptions);
  const [excludeKeyInput, setExcludeKeyInput] = useState('');
  const [queryType, setQueryType] = useState<
    'json-pointer' | 'jsonpath' | 'text'
  >('text');
  const [sortOptions, setSortOptions] =
    useState<SortOptions>(defaultSortOptions);

  // Parse data once for keyboard navigation
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json]);

  // Keyboard navigation
  const keyboard = useKeyboardNavigation(parsedData, {
    enabled: keyboardShortcuts,
    customShortcuts,
    onFocusChange: (path) => {
      if (path) {
        // Navigate to the focused path by setting it as search result
        const jsonPath = pathArrayToJsonPath(path);
        handleSearch(jsonPath);
      }
    },
    onCopy: () => {
      // Copy notification could be added here
      console.log('Value copied to clipboard');
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setQueryType('text');
      return;
    }

    try {
      const data = JSON.parse(json) as SearchableObject;
      const results = executeQuery(data, query);
      const detectedType = detectQueryType(query);

      setSearchResults(results);
      setCurrentResultIndex(0);
      setQueryType(detectedType);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const navigateResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    if (direction === 'next') {
      setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
    } else {
      setCurrentResultIndex((prev) =>
        prev === 0 ? searchResults.length - 1 : prev - 1,
      );
    }
  };

  const handleFilterChange = (
    key: keyof Omit<FilterOptions, 'excludedKeys'>,
  ) => {
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

  const handleObjectKeySortChange = (mode: ObjectKeySortMode) => {
    setSortOptions((prev) => ({
      ...prev,
      objectKeySort: mode,
    }));
  };

  const handleArrayItemSortChange = (mode: ArrayItemSortMode) => {
    setSortOptions((prev) => ({
      ...prev,
      arrayItemSort: mode,
    }));
  };

  const handleBreadcrumbNavigate = (path: string[]) => {
    // Convert path to JSONPath and search for it
    const jsonPath = pathArrayToJsonPath(path);
    handleSearch(jsonPath);
  };

  try {
    const data = JSON.parse(json);
    return (
      <div
        ref={keyboard.containerRef}
        className="w-full space-y-4 overflow-hidden"
      >
        {jsonSchema && schemaValidation && showValidationErrors && (
          <ValidationErrorPanel errors={schemaValidation.errors} />
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search, JSONPath ($.path), or JSON Pointer (/path)..."
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSearch(e.target.value)
              }
              className="pr-24 pl-8"
            />
            {searchQuery && (
              <div className="absolute top-2.5 right-2 text-muted-foreground text-xs">
                {queryType === 'json-pointer' && 'JSON Pointer'}
                {queryType === 'jsonpath' && 'JSONPath'}
                {queryType === 'text' && 'Text Search'}
              </div>
            )}
          </div>
          {showThemeToggle && <ThemeToggle />}
          <ExportButton data={data} filename="json-data" />
          {keyboardShortcuts && (
            <ShortcutsHelpButton onClick={() => keyboard.setShowHelp(true)} />
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowDownAZ className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Sort Object Keys</h4>
                  <div className="grid gap-2">
                    {(
                      [
                        'original',
                        'alphabetical',
                        'reverse-alphabetical',
                      ] as ObjectKeySortMode[]
                    ).map((mode) => (
                      <Button
                        key={mode}
                        variant={
                          sortOptions.objectKeySort === mode
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleObjectKeySortChange(mode)}
                        className="justify-start"
                      >
                        {getObjectKeySortLabel(mode)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Sort Array Items</h4>
                  <div className="grid gap-2">
                    {(
                      [
                        'original',
                        'ascending',
                        'descending',
                        'alphabetical',
                        'reverse-alphabetical',
                      ] as ArrayItemSortMode[]
                    ).map((mode) => (
                      <Button
                        key={mode}
                        variant={
                          sortOptions.arrayItemSort === mode
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleArrayItemSortChange(mode)}
                        className="justify-start"
                      >
                        {getArrayItemSortLabel(mode)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Show/Hide Types</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-strings"
                        checked={filterOptions.showStrings}
                        onCheckedChange={() =>
                          handleFilterChange('showStrings')
                        }
                      />
                      <Label htmlFor="show-strings">Strings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-numbers"
                        checked={filterOptions.showNumbers}
                        onCheckedChange={() =>
                          handleFilterChange('showNumbers')
                        }
                      />
                      <Label htmlFor="show-numbers">Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-booleans"
                        checked={filterOptions.showBooleans}
                        onCheckedChange={() =>
                          handleFilterChange('showBooleans')
                        }
                      />
                      <Label htmlFor="show-booleans">Booleans</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-null"
                        checked={filterOptions.showNull}
                        onCheckedChange={() => handleFilterChange('showNull')}
                      />
                      <Label htmlFor="show-null">Null</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-objects"
                        checked={filterOptions.showObjects}
                        onCheckedChange={() =>
                          handleFilterChange('showObjects')
                        }
                      />
                      <Label htmlFor="show-objects">Objects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-arrays"
                        checked={filterOptions.showArrays}
                        onCheckedChange={() => handleFilterChange('showArrays')}
                      />
                      <Label htmlFor="show-arrays">Arrays</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Exclude Keys</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key to exclude..."
                      value={excludeKeyInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setExcludeKeyInput(e.target.value)
                      }
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                        e.key === 'Enter' && handleAddExcludedKey()
                      }
                    />
                    <Button onClick={handleAddExcludedKey} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {filterOptions.excludedKeys.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm">{key}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExcludedKey(key)}
                          className="h-6 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {currentResultIndex + 1} of {searchResults.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateResults('prev')}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateResults('next')}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        {searchResults.length > 0 && searchResults[currentResultIndex] && (
          <BreadcrumbNav
            path={searchResults[currentResultIndex].path}
            onNavigate={handleBreadcrumbNavigate}
            className="rounded-md bg-muted/50 px-1 py-2"
          />
        )}
        <PojoViewer
          data={data}
          renderers={renderers}
          transformers={transformers}
          highlightedPath={
            searchResults[currentResultIndex]?.path.join('.') || ''
          }
          filterOptions={filterOptions}
          searchQuery={queryType === 'text' ? searchQuery : ''}
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
  } catch (error) {
    return <div>Invalid JSON: {(error as Error).message}</div>;
  }
}
