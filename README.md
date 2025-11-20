# JSON Viewer

A recursive JSON viewer component with custom renderer support for React. Uses TailwindCSS and ShadCN.

## Components

- `JsonViewer` - A component that parses a JSON value (string) and renders it as a tree of JSX elements. This uses the `PojoViewer` component internally.
- `PojoViewer` - A component that renders a plain old JavaScript object (POJO) as a tree of JSX elements. You can pass anything including values that are not JSON serializable, but you'll need to implement your own renderers for them.

## Features

- [x] Add a way to pass custom renderers for values that may or may not be JSON serializable.
  - [x] Allow special rendering depending on the path in the JSON.
  - [x] Automatically detect the best renderer for a value.
- [x] Allow customizing of inline (collapsed) renderers.
- [x] Allow adhering to a schema, so that the viewer can automatically detect the type of a value and render it accordingly.
- [x] Allow editing of values adhering to the schema.
- [x] Add search functionality to find values in large JSON structures
- [x] Add filtering capabilities to show/hide specific keys or value types
- [x] Add sorting options for object keys and array items
- [x] Add export functionality to download the JSON in different formats (JSON, YAML, CSV)
- [x] Add dark mode support with theme customization
- [x] Add syntax highlighting for string values containing code
- [x] Add validation indicators for common formats (email, URL, date, etc.)
- [x] Add diff view to compare two JSON structures
- [x] Add path navigation breadcrumbs
- [x] Add keyboard shortcuts for navigation and actions
- [x] Add ability to bookmark specific paths in the JSON
- [x] Add support for JSON schema validation
- [x] Add performance optimizations for large JSON structures
  - [x] Implement virtualization for large arrays/objects
  - [x] Add lazy loading for deeply nested structures
- [x] Add support for custom value transformations
- [x] Add support for JSON Pointer and JSONPath queries

## Installation

```bash
npm install @umstek/json-viewer
```

## Usage

```tsx
import { JsonViewer } from '@umstek/json-viewer';

<JsonViewer json="..." />;
```

```tsx
import { PojoViewer } from '@umstek/json-viewer';

<PojoViewer data={/** your POJO */} />;
```
