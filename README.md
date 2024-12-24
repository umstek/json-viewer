# JSON Viewer

A recursive table-based JSON viewer component for React.

## Components

- `JsonViewer` - A component that parses a JSON value (string) and renders it as a tree of JSX elements. This uses the `PojoViewer` component internally.
- `PojoViewer` - A component that renders a plain old JavaScript object (POJO) as a tree of JSX elements. You can pass anything including values that are not JSON serializable, but you'll need to implement your own renderers for them.

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
