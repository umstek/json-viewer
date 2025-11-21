/**
 * Keyboard shortcuts feature types and interfaces
 */

/**
 * Represents a single keyboard shortcut
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display name for the shortcut */
  name: string;
  /** Description of what the shortcut does */
  description: string;
  /** Keyboard key(s) to trigger the shortcut */
  keys: string[];
  /** Whether Ctrl/Cmd modifier is required */
  ctrl?: boolean;
  /** Whether Alt modifier is required */
  alt?: boolean;
  /** Whether Shift modifier is required */
  shift?: boolean;
  /** Category for grouping shortcuts in help panel */
  category: 'navigation' | 'actions' | 'search' | 'view';
}

/**
 * Keyboard shortcut handler function
 */
export type KeyboardHandler = (event?: KeyboardEvent) => void;

/**
 * Map of shortcut IDs to their handler functions
 */
export interface KeyboardHandlerMap {
  [shortcutId: string]: KeyboardHandler;
}

/**
 * Custom keyboard shortcut configuration
 */
export interface CustomKeyboardShortcut {
  /** Shortcut ID to override */
  id: string;
  /** New keyboard keys */
  keys: string[];
  /** Modifiers */
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

/**
 * Focus state for keyboard navigation
 */
export interface FocusState {
  /** Current focused path in the JSON tree */
  focusedPath: string[] | null;
  /** Index of focused node in flat list */
  focusedIndex: number;
  /** Total number of navigable nodes */
  totalNodes: number;
  /** List of all navigable paths */
  navigablePaths: string[][];
}

/**
 * Options for keyboard navigation
 */
export interface KeyboardNavigationOptions {
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean;
  /** Custom keyboard shortcuts to override defaults */
  customShortcuts?: CustomKeyboardShortcut[];
  /** Callback when focus changes */
  onFocusChange?: (path: string[] | null) => void;
  /** Callback when a node is expanded/collapsed via keyboard */
  onToggleExpand?: (path: string[]) => void;
  /** Callback when copy shortcut is triggered */
  onCopy?: (path: string[], value: unknown) => void;
}

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'navigate-up',
    name: 'Navigate Up',
    description: 'Move focus to the previous node',
    keys: ['ArrowUp'],
    category: 'navigation',
  },
  {
    id: 'navigate-down',
    name: 'Navigate Down',
    description: 'Move focus to the next node',
    keys: ['ArrowDown'],
    category: 'navigation',
  },
  {
    id: 'expand-node',
    name: 'Expand Node',
    description: 'Expand the focused node',
    keys: ['ArrowRight'],
    category: 'navigation',
  },
  {
    id: 'collapse-node',
    name: 'Collapse Node',
    description: 'Collapse the focused node',
    keys: ['ArrowLeft'],
    category: 'navigation',
  },
  {
    id: 'toggle-expand',
    name: 'Toggle Expand/Collapse',
    description: 'Toggle expand/collapse on the focused node',
    keys: ['Enter'],
    category: 'navigation',
  },
  {
    id: 'jump-to-first',
    name: 'Jump to First',
    description: 'Jump to the first visible node',
    keys: ['Home'],
    category: 'navigation',
  },
  {
    id: 'jump-to-last',
    name: 'Jump to Last',
    description: 'Jump to the last visible node',
    keys: ['End'],
    category: 'navigation',
  },

  // Actions
  {
    id: 'copy-value',
    name: 'Copy Value',
    description: 'Copy the current value to clipboard',
    keys: ['c', 'C'],
    ctrl: true,
    category: 'actions',
  },
  {
    id: 'open-export',
    name: 'Open Export',
    description: 'Open the export menu',
    keys: ['e', 'E'],
    ctrl: true,
    category: 'actions',
  },
  {
    id: 'toggle-bookmarks',
    name: 'Toggle Bookmarks',
    description: 'Toggle the bookmarks panel',
    keys: ['b', 'B'],
    ctrl: true,
    category: 'actions',
  },

  // Search
  {
    id: 'focus-search',
    name: 'Focus Search',
    description: 'Focus the search input',
    keys: ['f', 'F'],
    ctrl: true,
    category: 'search',
  },
  {
    id: 'clear-search',
    name: 'Clear Search',
    description: 'Clear search and deselect',
    keys: ['Escape'],
    category: 'search',
  },

  // View
  {
    id: 'show-help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts help',
    keys: ['?', '/'],
    ctrl: false,
    category: 'view',
  },
  {
    id: 'show-help-alt',
    name: 'Show Help (Alt)',
    description: 'Show keyboard shortcuts help (alternative)',
    keys: ['/'],
    ctrl: true,
    category: 'view',
  },
];
