# JSONPath and JSON Pointer Query Examples

This document provides examples of using the JSONPath and JSON Pointer query features in the JSON Viewer.

## Query Types

The JSON Viewer now supports three types of queries:

1. **Text Search** - Simple text matching in keys and values
2. **JSONPath** - JSONPath expressions starting with `$`
3. **JSON Pointer** - RFC 6901 JSON Pointer references starting with `/`

The query type is automatically detected based on the input.

## Sample JSON Data

For the examples below, we'll use this sample JSON:

```json
{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  },
  "user": {
    "name": "Alice",
    "email": "alice@example.com",
    "roles": ["admin", "user"]
  }
}
```

## Text Search Examples

Simple text matching (case-insensitive):

- `alice` - Finds all keys and values containing "alice"
- `book` - Finds all keys containing "book"
- `reference` - Finds all values containing "reference"
- `price` - Finds all keys named "price"

## JSONPath Examples

JSONPath expressions start with `$`:

### Basic Path Navigation

- `$` - Root object
- `$.store` - The store object
- `$.user.name` - Alice
- `$.store.bicycle.color` - "red"

### Array Access

- `$.store.book[0]` - First book object
- `$.store.book[0].title` - "Sayings of the Century"
- `$.store.book[1].author` - "Evelyn Waugh"
- `$.user.roles[0]` - "admin"

### Nested Access

- `$.store.book[0].price` - 8.95
- `$.store.bicycle.price` - 19.95
- `$.user.roles[1]` - "user"

### Bracket Notation

- `$["store"]["book"][0]["title"]` - "Sayings of the Century"
- `$['user']['email']` - "alice@example.com"

## JSON Pointer Examples

JSON Pointer expressions start with `/` (RFC 6901):

### Basic Pointers

- `/store` - The store object
- `/user/name` - "Alice"
- `/store/bicycle/color` - "red"

### Array Access

- `/store/book/0` - First book object
- `/store/book/0/title` - "Sayings of the Century"
- `/store/book/1/author` - "Evelyn Waugh"
- `/user/roles/0` - "admin"

### Nested Access

- `/store/book/0/price` - 8.95
- `/store/bicycle/price` - 19.95
- `/user/roles/1` - "user"

### Special Characters

JSON Pointer escapes special characters:
- `~0` represents `~`
- `~1` represents `/`

Example: `/path~1to~0value` refers to the key "path/to~value"

## Usage in the Component

The query input automatically detects the type based on your input:

```typescript
import JsonViewer from '@umstek/json-viewer';

function MyComponent() {
  const jsonData = JSON.stringify(data, null, 2);

  return <JsonViewer json={jsonData} />;
}
```

When you type in the search box:
- **Text Search**: Type any text (e.g., `alice`)
- **JSONPath**: Start with `$` (e.g., `$.store.book[0].title`)
- **JSON Pointer**: Start with `/` (e.g., `/store/book/0/title`)

The viewer will:
1. Automatically detect the query type
2. Execute the query
3. Highlight matching paths
4. Auto-expand the tree to show results
5. Display the query type in the search box

## Utility Functions API

You can also use the utility functions directly:

```typescript
import {
  executeQuery,
  pathArrayToJsonPath,
  pathArrayToJsonPointer,
  jsonPathToPathArray,
  jsonPointerToPathArray,
  detectQueryType,
} from '@umstek/json-viewer/utils/jsonpath';

// Execute a query
const data = { store: { book: [{ title: "Book" }] } };
const results = executeQuery(data, '$.store.book[0].title');
// results[0].value === "Book"
// results[0].path === ['store', 'book', '0', 'title']
// results[0].jsonPointer === '/store/book/0/title'
// results[0].jsonPath === '$.store.book[0].title'

// Convert between formats
const path = ['store', 'book', '0', 'title'];
const jsonPath = pathArrayToJsonPath(path);
// jsonPath === '$.store.book[0].title'
const jsonPointer = pathArrayToJsonPointer(path);
// jsonPointer === '/store/book/0/title'

// Parse paths
const pathFromJsonPath = jsonPathToPathArray('$.store.book[0].title');
// pathFromJsonPath === ['store', 'book', '0', 'title']
const pathFromPointer = jsonPointerToPathArray('/store/book/0/title');
// pathFromPointer === ['store', 'book', '0', 'title']

// Detect query type
detectQueryType('$.path'); // 'jsonpath'
detectQueryType('/path'); // 'json-pointer'
detectQueryType('search'); // 'text'
```

## Features

- **Automatic Query Detection**: The viewer detects the query type automatically
- **Path Highlighting**: Matching paths are highlighted with a yellow background
- **Auto-Expansion**: The tree automatically expands to show matching results
- **Multiple Results**: Navigate through multiple results using Previous/Next buttons
- **Result Counter**: Shows current result index and total count
- **No External Dependencies**: Lightweight implementation without external JSONPath libraries
- **Type Safety**: Full TypeScript support with exported types

## Limitations

The current implementation supports common JSONPath and JSON Pointer use cases:
- Basic path navigation
- Array index access
- Bracket and dot notation
- Nested object access

Advanced JSONPath features not currently supported:
- Wildcards (`*`, `..`)
- Array slicing (`[start:end]`)
- Filter expressions (`[?(@.price < 10)]`)
- Union operators (`[0,1]`)
- Recursive descent (`..`)

For advanced JSONPath features, consider using the `jsonpath-plus` library directly.

## Implementation Details

The implementation is located in:
- **Utility Module**: `/home/user/json-viewer/src/components/json-viewer/utils/jsonpath.ts`
- **Component Integration**: `/home/user/json-viewer/src/components/json-viewer/index.tsx`
- **Tests**: `/home/user/json-viewer/src/components/json-viewer/utils/jsonpath.test.ts`

All tests pass (29/29) and the code follows TypeScript best practices with full type safety.
