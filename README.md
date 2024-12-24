# JSON Viewer

A recursive table-based JSON viewer component for React.

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

## Installation

```bash
npm install @umstek/json-viewer
```

## Usage

```tsx
import JsonViewer from '@umstek/json-viewer';

<JsonViewer json="..." />;
```

```tsx
import PojoViewer from '@umstek/json-viewer';

<PojoViewer data={/** your POJO */} />;
```
