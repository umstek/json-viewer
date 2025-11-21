# json-viewer

A composable JSON/POJO viewer for React with smart format detection and custom renderers.

## Install

```bash
npm install @umstek/json-viewer
```

## Usage

```tsx
import { JsonViewer } from '@umstek/json-viewer';

<JsonViewer json={jsonString} />
```

Or for plain objects:

```tsx
import { PojoViewer } from '@umstek/json-viewer';

<PojoViewer data={object} />
```

## Custom Renderers

Use `createRegistry` to render custom components at specific paths:

```tsx
import { createRegistry } from '@umstek/json-viewer';

const registry = createRegistry({
  pathRenderers: [
    {
      pattern: '$.users[*]',
      render: ({ value, path, registry }) => (
        <UserCard user={value}>
          {registry.render(value.address, [...path, 'address'])}
        </UserCard>
      ),
    },
  ],
});
```

## Format Detection

Automatically detects and renders actionable formats:

| Format | Action |
|--------|--------|
| Email | `mailto:` link |
| Phone | `tel:` link |
| URL | Clickable link, image preview |
| Date/DateTime | Timezone display |
| IPv4 | Segmented display |
| UUID | Copy button |

## Other Features

- Diff viewer for comparing JSON
- Export to JSON/YAML/CSV
- JSONPath/JSON Pointer queries
- Keyboard navigation
- Dark mode
- Virtualization for large data

## License

MIT
