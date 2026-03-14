import { useMemo } from 'react';

export interface ParsedJsonResult {
  data: unknown;
  error: Error | null;
}

/**
 * Custom hook to parse JSON string once per input change.
 * Returns the parsed data and any parsing error.
 */
export function useParsedJson(jsonString: string): ParsedJsonResult {
  return useMemo(() => {
    try {
      const data = JSON.parse(jsonString);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, [jsonString]);
}
