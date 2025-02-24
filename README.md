# JSON Viewer

A recursive JSON viewer component with custom renderer support for React. Uses TailwindCSS and ShadCN.

## Components

- `JsonViewer` - A component that parses a JSON value (string) and renders it as a tree of JSX elements. This uses the `PojoViewer` component internally.
- `PojoViewer` - A component that renders a plain old JavaScript object (POJO) as a tree of JSX elements. You can pass anything including values that are not JSON serializable, but you'll need to implement your own renderers for them.

## Plan/todo

- [x] Add a way to pass custom renderers for values that may or may not be JSON serializable.
  - [x] Allow special rendering depending on the path in the JSON.
  - [x] Automatically detect the best renderer for a value.
- [ ] Allow customizing of inline (collapsed) renderers.
- [ ] Allow adhering to a schema, so that the viewer can automatically detect the type of a value and render it accordingly.
- [ ] Allow editing of values adhering to the schema.
- [ ] Add search functionality to find values in large JSON structures
- [ ] Add filtering capabilities to show/hide specific keys or value types
- [ ] Add sorting options for object keys and array items
- [ ] Add export functionality to download the JSON in different formats (JSON, YAML, CSV)
- [ ] Add dark mode support with theme customization
- [ ] Add syntax highlighting for string values containing code
- [ ] Add validation indicators for common formats (email, URL, date, etc.)
- [ ] Add diff view to compare two JSON structures
- [ ] Add path navigation breadcrumbs
- [ ] Add keyboard shortcuts for navigation and actions
- [ ] Add ability to bookmark specific paths in the JSON
- [ ] Add support for JSON schema validation
- [ ] Add performance optimizations for large JSON structures
  - [ ] Implement virtualization for large arrays/objects
  - [ ] Add lazy loading for deeply nested structures
- [ ] Add support for custom value transformations
- [ ] Add support for JSON Pointer and JSONPath queries

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
