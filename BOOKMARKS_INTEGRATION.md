# Bookmarks Integration Guide

This document provides instructions for integrating the bookmarks feature into the JSON Viewer component.

## Overview

The bookmarks feature has been implemented in the following files:
- `/home/user/json-viewer/src/components/json-viewer/features/bookmarks/bookmark-manager.tsx` - Main bookmark UI component
- `/home/user/json-viewer/src/components/json-viewer/features/bookmarks/index.ts` - Exports
- `/home/user/json-viewer/src/components/json-viewer/renderer/router.tsx` - Visual indicators for bookmarked paths (COMPLETED)
- `/home/user/json-viewer/src/components/json-viewer/pojo-viewer.tsx` - Pass-through for bookmarked paths (COMPLETED)
- `/home/user/json-viewer/src/index.ts` - Public API exports (COMPLETED)

## Remaining Integration: json-viewer/index.tsx

The main JSON viewer component needs the following changes:

### 1. Add Imports

Add the following imports at the top of the file:

```typescript
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,  // Add this
  useMemo,
  useState,
} from 'react';

// Add these imports after the Button import
import {
  BookmarkManager,
  type BookmarkEntry,
} from './features/bookmarks';

// Make sure pathArrayToJsonPointer is also imported from utils/jsonpath
import {
  detectQueryType,
  executeQuery,
  pathArrayToJsonPath,
  pathArrayToJsonPointer,  // Add this
  type QueryResult,
} from './utils/jsonpath';
```

### 2. Update JsonViewerProps Interface

Add bookmark-related props:

```typescript
export interface JsonViewerProps {
  json: string;
  dateOptions?: DateRendererOptions;
  codeOptions?: CodeRendererOptions;
  transformers?: Transformer[];
  showThemeToggle?: boolean;
  maxInitialDepth?: number;
  lazyLoadingEnabled?: boolean;
  enableBookmarks?: boolean;  // Add this
  bookmarksPersistenceKey?: string;  // Add this
}
```

### 3. Add State and Props

In the `JsonViewer` function, add the new props to the destructuring:

```typescript
export default function JsonViewer({
  json,
  dateOptions,
  codeOptions,
  transformers = [],
  showThemeToggle = false,
  maxInitialDepth = 3,
  lazyLoadingEnabled = true,
  enableBookmarks = false,  // Add this
  bookmarksPersistenceKey,  // Add this
}: JsonViewerProps) {
```

Add bookmark state after the existing state declarations:

```typescript
  const [sortOptions, setSortOptions] =
    useState<SortOptions>(defaultSortOptions);

  // Add this new state
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
```

### 4. Add useEffect Hooks for localStorage

Add these effects after the state declarations:

```typescript
  // Load bookmarks from localStorage on mount
  useEffect(() => {
    if (!enableBookmarks || !bookmarksPersistenceKey) return;

    try {
      const saved = localStorage.getItem(
        `json-viewer-bookmarks-${bookmarksPersistenceKey}`,
      );
      if (saved) {
        const parsed = JSON.parse(saved) as BookmarkEntry[];
        setBookmarks(parsed);
      }
    } catch (error) {
      console.error('Failed to load bookmarks from localStorage:', error);
    }
  }, [enableBookmarks, bookmarksPersistenceKey]);

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    if (!enableBookmarks || !bookmarksPersistenceKey) return;

    try {
      localStorage.setItem(
        `json-viewer-bookmarks-${bookmarksPersistenceKey}`,
        JSON.stringify(bookmarks),
      );
    } catch (error) {
      console.error('Failed to save bookmarks to localStorage:', error);
    }
  }, [bookmarks, enableBookmarks, bookmarksPersistenceKey]);
```

### 5. Add Bookmark Handler Functions

Add these handler functions after `handleBreadcrumbNavigate`:

```typescript
  const handleAddBookmark = (
    bookmark: Omit<BookmarkEntry, 'id' | 'createdAt'>,
  ) => {
    const newBookmark: BookmarkEntry = {
      ...bookmark,
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    };
    setBookmarks((prev) => [...prev, newBookmark]);
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleNavigateToBookmark = (path: string[]) => {
    const jsonPath = pathArrayToJsonPath(path);
    handleSearch(jsonPath);
  };
```

### 6. Add Memoized Bookmarked Paths Set

Add this after the handler functions:

```typescript
  // Get bookmarked paths as a Set for quick lookup
  const bookmarkedPaths = useMemo(() => {
    return new Set(bookmarks.map((b) => b.path.join('.')));
  }, [bookmarks]);
```

### 7. Add BookmarkManager to Toolbar

In the JSX, add the BookmarkManager after the ExportButton (around line 202):

```typescript
          {showThemeToggle && <ThemeToggle />}
          <ExportButton data={data} filename="json-data" />
          {enableBookmarks && (
            <BookmarkManager
              bookmarks={bookmarks}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              onNavigateToBookmark={handleNavigateToBookmark}
              currentPath={searchResults[currentResultIndex]?.path}
            />
          )}
          <Popover>
```

### 8. Pass bookmarkedPaths to PojoViewer

Update the PojoViewer component call to include bookmarkedPaths:

```typescript
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
          maxInitialDepth={maxInitialDepth}
          lazyLoadingEnabled={lazyLoadingEnabled}
          bookmarkedPaths={bookmarkedPaths}  // Add this
        />
```

## Usage Example

```tsx
import { JsonViewer } from 'json-viewer';

function App() {
  return (
    <JsonViewer
      json='{"name": "John", "age": 30}'
      enableBookmarks={true}
      bookmarksPersistenceKey="my-app"
    />
  );
}
```

## Features

- **Bookmark Current Path**: Users can bookmark the currently highlighted search result
- **Custom Path Bookmarking**: Users can manually enter JSONPath or JSON Pointer paths to bookmark
- **Visual Indicators**: Bookmarked paths show a yellow star icon in the tree view
- **localStorage Persistence**: Bookmarks are automatically saved to localStorage (when `bookmarksPersistenceKey` is provided)
- **Navigate to Bookmarks**: Clicking a bookmark navigates to that path in the JSON structure
- **Manage Bookmarks**: Users can view, name, and remove bookmarks

## Bookmark Data Structure

```typescript
interface BookmarkEntry {
  id: string;              // Unique identifier
  name: string;            // User-provided name
  path: string[];          // Path as array of keys
  jsonPath: string;        // JSONPath representation
  jsonPointer: string;     // JSON Pointer representation
  createdAt: number;       // Timestamp
}
```

## Notes

- The `enableBookmarks` prop must be set to `true` to show the bookmark button
- The `bookmarksPersistenceKey` prop is optional but recommended for localStorage persistence
- If no key is provided, bookmarks will only persist in component state (lost on unmount)
- Bookmarks are scoped to the `bookmarksPersistenceKey`, allowing different bookmark sets for different JSON data
