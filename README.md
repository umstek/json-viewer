# json-viewer

A composable JSON/POJO viewer for React with smart format detection and custom renderers.

## Install

```bash
npm install @umstek/json-viewer
```

## Usage

```tsx
import { JsonViewer } from '@umstek/json-viewer';

<JsonViewer json={jsonString} />;
```

Or for plain objects:

```tsx
import { PojoViewer } from '@umstek/json-viewer';

<PojoViewer data={object} />;
```

## Custom Renderers

Use the `renderers` prop on `JsonViewer` or `PojoViewer`. This is the same renderer pipeline used internally, so custom extensions follow the same architecture as the built-in viewer. Renderers run in order, return JSX when they handle a value, and return `null` to fall through to the next renderer.

```tsx
import { JsonViewer, createPathRenderer, createTypeRenderer } from '@umstek/json-viewer';

const userCardRenderer = createPathRenderer('$.users[*]', ({ value, path, render }) => {
  const user = value as {
    name: string;
    address: { city: string; country: string };
  };

  return <UserCard user={user}>{render(user.address, [...path, 'address'])}</UserCard>;
});

const statusRenderer = createTypeRenderer(
  (value, path) => path[path.length - 1] === 'status' && typeof value === 'string',
  ({ value }) => <StatusBadge status={value as string} />,
);

<JsonViewer json={jsonString} renderers={[userCardRenderer, statusRenderer]} />;
```

The same renderer API works with `PojoViewer data={object}`. Use the `render(value, path)` helper inside a custom renderer when you want to delegate nested content back to the built-in viewer pipeline.

## Format Detection

Automatically detects and renders actionable formats:

| Format        | Action                        |
| ------------- | ----------------------------- |
| Email         | `mailto:` link                |
| Phone         | `tel:` link                   |
| URL           | Clickable link, image preview |
| Date/DateTime | Timezone display              |
| IPv4          | Segmented display             |
| UUID          | Copy button                   |

## Other Features

- Diff viewer for comparing JSON
- Export to JSON/YAML/CSV
- JSONPath/JSON Pointer queries
- Keyboard navigation
- Dark mode
- Virtualization for large data

## License

MIT
