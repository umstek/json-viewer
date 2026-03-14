import { useMemo, useState } from 'react';
import {
  detectQueryType,
  executeQuery,
  pathArrayToJsonPath,
  type QueryResult,
} from '../utils/jsonpath';

export interface SearchState {
  query: string;
  results: QueryResult[];
  currentResultIndex: number;
  queryType: 'json-pointer' | 'jsonpath' | 'text';
}

/**
 * Custom hook to manage search functionality.
 * Handles query execution, result navigation, and query type detection.
 */
export function useSearch(data: unknown) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    currentResultIndex: 0,
    queryType: 'text',
  });

  const handleSearch = useMemo(
    () => (query: string) => {
      if (!query) {
        setSearchState({
          query: '',
          results: [],
          currentResultIndex: 0,
          queryType: 'text',
        });
        return;
      }

      try {
        const results = executeQuery(data, query);
        const detectedType = detectQueryType(query);

        setSearchState({
          query,
          results,
          currentResultIndex: 0,
          queryType: detectedType,
        });
      } catch (error) {
        console.error('Search error:', error);
        setSearchState((prev) => ({
          ...prev,
          query,
          results: [],
        }));
      }
    },
    [data],
  );

  const navigateResults = (direction: 'next' | 'prev') => {
    if (searchState.results.length === 0) return;

    setSearchState((prev) => {
      if (direction === 'next') {
        return {
          ...prev,
          currentResultIndex: (prev.currentResultIndex + 1) % prev.results.length,
        };
      }
      return {
        ...prev,
        currentResultIndex:
          prev.currentResultIndex === 0 ? prev.results.length - 1 : prev.currentResultIndex - 1,
      };
    });
  };

  const navigateToPath = (path: string[]) => {
    const jsonPath = pathArrayToJsonPath(path);
    handleSearch(jsonPath);
  };

  return {
    searchState,
    handleSearch,
    navigateResults,
    navigateToPath,
  };
}
