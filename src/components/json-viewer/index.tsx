import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, Search } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import PojoViewer from './pojo-viewer';
import type { FilterOptions } from './pojo-viewer';
import { createDateRenderer } from './renderer/advanced/date';
import type { DateRendererOptions } from './renderer/advanced/date';
import { createLinkRenderer } from './renderer/advanced/link';

export interface JsonViewerProps {
  json: string;
  dateOptions?: DateRendererOptions;
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
export default function JsonViewer({ json, dateOptions }: JsonViewerProps) {
  const renderers = useMemo(
    () => [createDateRenderer(dateOptions), createLinkRenderer()],
    [dateOptions],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(defaultFilterOptions);
  const [excludeKeyInput, setExcludeKeyInput] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    try {
      const data = JSON.parse(json) as SearchableObject;
      const paths: string[] = [];

      const searchInObject = (obj: SearchableObject, path: string[] = []) => {
        if (!obj) return;

        if (typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...path, key];

            // Search in key
            if (key.toLowerCase().includes(query.toLowerCase())) {
              paths.push(currentPath.join('.'));
            }

            // Search in value
            if (
              typeof value === 'string' &&
              value.toLowerCase().includes(query.toLowerCase())
            ) {
              paths.push(currentPath.join('.'));
            }

            // Recurse into nested objects/arrays
            if (value && typeof value === 'object') {
              searchInObject(value as SearchableObject, currentPath);
            }
          }
        }
      };

      searchInObject(data);
      setSearchResults(paths);
      setCurrentResultIndex(0);
    } catch (error) {
      console.error('Search error:', error);
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

  try {
    const data = JSON.parse(json);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in JSON..."
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSearch(e.target.value)
              }
              className="pl-8"
            />
          </div>
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
        <PojoViewer
          data={data}
          renderers={renderers}
          highlightedPath={searchResults[currentResultIndex]}
          filterOptions={filterOptions}
          searchQuery={searchQuery}
        />
      </div>
    );
  } catch (error) {
    return <div>Invalid JSON: {(error as Error).message}</div>;
  }
}
