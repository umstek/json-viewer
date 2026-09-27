/**
 * Bounded undo/redo history hook for JSON editing
 */

import { useState } from 'react';

export interface EditHistoryOptions {
  /** Maximum number of past snapshots retained. Default 100. */
  maxHistory?: number;
}

export interface EditHistoryController {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditHistory extends EditHistoryController {
  data: unknown;
  setValue: (path: string[], newValue: unknown) => void;
  reset: (nextData: unknown) => void;
}

const DEFAULT_MAX_HISTORY = 100;

interface HistoryState {
  data: unknown;
  history: unknown[];
  historyIndex: number;
}

/**
 * Hook to manage JSON data with a bounded undo/redo history.
 * All mutations use functional setState updates so synchronous bursts
 * of setValue calls compose correctly instead of reading stale closures.
 */
export function useEditHistory(initialData: unknown, options?: EditHistoryOptions): EditHistory {
  const maxHistory = options?.maxHistory ?? DEFAULT_MAX_HISTORY;

  const [state, setState] = useState<HistoryState>({
    data: initialData,
    history: [initialData],
    historyIndex: 0,
  });

  const setValue = (path: string[], newValue: unknown) => {
    setState((prev) => {
      const newData = updateValueAtPath(prev.data, path, newValue);

      // Truncate future snapshots, then push the new snapshot
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      // Cap retained past snapshots, keeping the current snapshot
      if (newHistory.length > maxHistory + 1) {
        newHistory.splice(0, newHistory.length - (maxHistory + 1));
      }

      return { data: newData, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };

  const undo = () => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      return {
        ...prev,
        historyIndex: prev.historyIndex - 1,
        data: prev.history[prev.historyIndex - 1],
      };
    });
  };

  const redo = () => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      return {
        ...prev,
        historyIndex: prev.historyIndex + 1,
        data: prev.history[prev.historyIndex + 1],
      };
    });
  };

  const reset = (nextData: unknown) => {
    setState({ data: nextData, history: [nextData], historyIndex: 0 });
  };

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return {
    data: state.data,
    setValue,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

/**
 * Updates a value at a specific path in a nested object/array
 */
export function updateValueAtPath(data: unknown, path: string[], newValue: unknown): unknown {
  if (path.length === 0) {
    return newValue;
  }

  if (Array.isArray(data)) {
    const index = Number.parseInt(path[0], 10);
    const newArray = [...data];
    if (path.length === 1) {
      newArray[index] = newValue;
    } else {
      newArray[index] = updateValueAtPath(data[index], path.slice(1), newValue);
    }
    return newArray;
  }

  if (typeof data === 'object' && data !== null) {
    const key = path[0];
    const newObject = { ...data } as Record<string, unknown>;
    if (path.length === 1) {
      newObject[key] = newValue;
    } else {
      newObject[key] = updateValueAtPath(
        (data as Record<string, unknown>)[key],
        path.slice(1),
        newValue,
      );
    }
    return newObject;
  }

  return data;
}
