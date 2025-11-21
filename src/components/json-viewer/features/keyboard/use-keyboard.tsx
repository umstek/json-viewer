import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CustomKeyboardShortcut,
  FocusState,
  KeyboardHandlerMap,
  KeyboardNavigationOptions,
  KeyboardShortcut,
} from './types';
import { DEFAULT_SHORTCUTS } from './types';

/**
 * Utility to check if a keyboard event matches a shortcut
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
): boolean {
  // Check modifiers
  const ctrlPressed = event.ctrlKey || event.metaKey;
  const altPressed = event.altKey;
  const shiftPressed = event.shiftKey;

  if (shortcut.ctrl && !ctrlPressed) return false;
  if (!shortcut.ctrl && ctrlPressed && shortcut.id !== 'show-help')
    return false;
  if (shortcut.alt && !altPressed) return false;
  if (shortcut.shift && !shiftPressed) return false;

  // Check key
  return shortcut.keys.includes(event.key);
}

/**
 * Merges custom shortcuts with default shortcuts
 */
function mergeShortcuts(
  defaultShortcuts: KeyboardShortcut[],
  customShortcuts?: CustomKeyboardShortcut[],
): KeyboardShortcut[] {
  if (!customShortcuts || customShortcuts.length === 0) {
    return defaultShortcuts;
  }

  const merged = [...defaultShortcuts];

  for (const custom of customShortcuts) {
    const index = merged.findIndex((s) => s.id === custom.id);
    if (index >= 0) {
      merged[index] = {
        ...merged[index],
        keys: custom.keys,
        ctrl: custom.ctrl ?? merged[index].ctrl,
        alt: custom.alt ?? merged[index].alt,
        shift: custom.shift ?? merged[index].shift,
      };
    }
  }

  return merged;
}

/**
 * Custom hook for keyboard navigation in the JSON viewer
 */
export function useKeyboardNavigation(
  data: unknown,
  options: KeyboardNavigationOptions = {},
) {
  const {
    enabled = true,
    customShortcuts,
    onFocusChange,
    onToggleExpand,
    onCopy,
  } = options;

  const [focusState, setFocusState] = useState<FocusState>({
    focusedPath: null,
    focusedIndex: -1,
    totalNodes: 0,
    navigablePaths: [],
  });

  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge custom shortcuts with defaults
  const shortcuts = mergeShortcuts(DEFAULT_SHORTCUTS, customShortcuts);

  /**
   * Extract all navigable paths from the data structure
   */
  const extractNavigablePaths = useCallback((obj: unknown): string[][] => {
    const paths: string[][] = [];

    function traverse(value: unknown, currentPath: string[] = []) {
      // Add current path if it's not root
      if (currentPath.length > 0) {
        paths.push([...currentPath]);
      }

      // Traverse into objects and arrays
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          traverse(value[i], [...currentPath, String(i)]);
        }
      } else if (value !== null && typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
          traverse(val, [...currentPath, key]);
        }
      }
    }

    traverse(obj);
    return paths;
  }, []);

  /**
   * Update navigable paths when data changes
   */
  useEffect(() => {
    if (!enabled) return;

    const paths = extractNavigablePaths(data);
    setFocusState((prev) => ({
      ...prev,
      totalNodes: paths.length,
      navigablePaths: paths,
    }));
  }, [data, enabled, extractNavigablePaths]);

  /**
   * Navigate to a specific path
   */
  const navigateToPath = useCallback(
    (path: string[] | null, index: number) => {
      setFocusState((prev) => ({
        ...prev,
        focusedPath: path,
        focusedIndex: index,
      }));
      onFocusChange?.(path);
    },
    [onFocusChange],
  );

  /**
   * Navigate up (previous node)
   */
  const navigateUp = useCallback(() => {
    setFocusState((prev) => {
      const newIndex = Math.max(0, prev.focusedIndex - 1);
      const newPath = prev.navigablePaths[newIndex] || null;
      onFocusChange?.(newPath);
      return {
        ...prev,
        focusedIndex: newIndex,
        focusedPath: newPath,
      };
    });
  }, [onFocusChange]);

  /**
   * Navigate down (next node)
   */
  const navigateDown = useCallback(() => {
    setFocusState((prev) => {
      const newIndex = Math.min(prev.totalNodes - 1, prev.focusedIndex + 1);
      const newPath = prev.navigablePaths[newIndex] || null;
      onFocusChange?.(newPath);
      return {
        ...prev,
        focusedIndex: newIndex,
        focusedPath: newPath,
      };
    });
  }, [onFocusChange]);

  /**
   * Jump to first node
   */
  const jumpToFirst = useCallback(() => {
    setFocusState((prev) => {
      const newPath = prev.navigablePaths[0] || null;
      onFocusChange?.(newPath);
      return {
        ...prev,
        focusedIndex: 0,
        focusedPath: newPath,
      };
    });
  }, [onFocusChange]);

  /**
   * Jump to last node
   */
  const jumpToLast = useCallback(() => {
    setFocusState((prev) => {
      const newIndex = prev.totalNodes - 1;
      const newPath = prev.navigablePaths[newIndex] || null;
      onFocusChange?.(newPath);
      return {
        ...prev,
        focusedIndex: newIndex,
        focusedPath: newPath,
      };
    });
  }, [onFocusChange]);

  /**
   * Get value at a specific path
   */
  const getValueAtPath = useCallback(
    (path: string[]): unknown => {
      // biome-ignore lint/suspicious/noExplicitAny: Need to traverse dynamic data structure
      let current: any = data;
      for (const key of path) {
        if (current && typeof current === 'object') {
          current = current[key];
        } else {
          return undefined;
        }
      }
      return current;
    },
    [data],
  );

  /**
   * Copy value to clipboard
   */
  const copyValue = useCallback(() => {
    if (!focusState.focusedPath) return;

    const value = getValueAtPath(focusState.focusedPath);
    const text =
      typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);

    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Failed to copy:', err);
    });

    onCopy?.(focusState.focusedPath, value);
  }, [focusState.focusedPath, getValueAtPath, onCopy]);

  /**
   * Toggle expand/collapse on focused node
   */
  const toggleExpand = useCallback(() => {
    if (!focusState.focusedPath) return;
    onToggleExpand?.(focusState.focusedPath);
  }, [focusState.focusedPath, onToggleExpand]);

  /**
   * Clear focus and search
   */
  const clearFocus = useCallback(() => {
    setFocusState((prev) => ({
      ...prev,
      focusedPath: null,
      focusedIndex: -1,
    }));
    onFocusChange?.(null);
  }, [onFocusChange]);

  /**
   * Focus search input
   */
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    searchInput?.focus();
  }, []);

  /**
   * Open export menu
   */
  const openExport = useCallback(() => {
    // Find and click the export button
    const exportButton = containerRef.current?.querySelector(
      'button[title="Export data"]',
    ) as HTMLButtonElement;
    exportButton?.click();
  }, []);

  /**
   * Toggle bookmarks panel
   */
  const toggleBookmarks = useCallback(() => {
    // Find and click the bookmarks button
    const bookmarksButton = containerRef.current?.querySelector(
      'button[aria-label="Bookmarks"]',
    ) as HTMLButtonElement;
    if (!bookmarksButton) {
      // Try alternative selector
      const bookmarkButtons =
        containerRef.current?.querySelectorAll('button[data-state]');
      bookmarkButtons?.[bookmarkButtons.length - 1]?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    } else {
      bookmarksButton.click();
    }
  }, []);

  /**
   * Show help panel
   */
  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  /**
   * Keyboard handler map
   */
  const handlers: KeyboardHandlerMap = useMemo(
    () => ({
      'navigate-up': navigateUp,
      'navigate-down': navigateDown,
      'expand-node': toggleExpand,
      'collapse-node': toggleExpand,
      'toggle-expand': toggleExpand,
      'jump-to-first': jumpToFirst,
      'jump-to-last': jumpToLast,
      'copy-value': copyValue,
      'focus-search': focusSearch,
      'clear-search': clearFocus,
      'open-export': openExport,
      'toggle-bookmarks': toggleBookmarks,
      'show-help': toggleHelp,
      'show-help-alt': toggleHelp,
    }),
    [
      navigateUp,
      navigateDown,
      toggleExpand,
      jumpToFirst,
      jumpToLast,
      copyValue,
      focusSearch,
      clearFocus,
      openExport,
      toggleBookmarks,
      toggleHelp,
    ],
  );

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape to work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          const handler = handlers[shortcut.id];
          if (handler) {
            // Prevent default for most shortcuts
            if (
              shortcut.ctrl ||
              shortcut.alt ||
              ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
            ) {
              event.preventDefault();
            }

            handler(event);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcuts, handlers]);

  return {
    focusState,
    showHelp,
    setShowHelp,
    navigateToPath,
    containerRef,
    shortcuts,
  };
}
