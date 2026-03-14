import { Search } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SearchState } from '../hooks/use-search';

export interface SearchBarProps {
  searchState: SearchState;
  onSearch: (query: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  searchState,
  onSearch,
  onNavigatePrev,
  onNavigateNext,
  inputRef,
}: SearchBarProps) {
  return (
    <>
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search, JSONPath ($.path), or JSON Pointer (/path)..."
          value={searchState.query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
          className="pr-24 pl-8"
        />
        {searchState.query && (
          <div className="text-muted-foreground absolute top-2.5 right-2 text-xs">
            {searchState.queryType === 'json-pointer' && 'JSON Pointer'}
            {searchState.queryType === 'jsonpath' && 'JSONPath'}
            {searchState.queryType === 'text' && 'Text Search'}
          </div>
        )}
      </div>
      {searchState.results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {searchState.currentResultIndex + 1} of {searchState.results.length}
          </span>
          <Button variant="outline" size="sm" onClick={onNavigatePrev}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={onNavigateNext}>
            Next
          </Button>
        </div>
      )}
    </>
  );
}
