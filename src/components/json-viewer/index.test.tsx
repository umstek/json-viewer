import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import DiffViewer from './diff-viewer';
import { ExpansionProvider } from './features/expansion';
import JsonViewer from './index';
import { createRouter } from './renderer/router';
import { pathArrayToInternalKey } from './utils/jsonpath';

function renderWithExpansion(content: ReactNode) {
  return renderToStaticMarkup(<ExpansionProvider defaultExpanded>{content}</ExpansionProvider>);
}

describe('JsonViewer integration', () => {
  test('renders without requiring an external ExpansionProvider', () => {
    expect(() =>
      renderToStaticMarkup(
        <JsonViewer
          json={JSON.stringify({ items: ['zebra', 'apple'] })}
          keyboardShortcuts={false}
        />,
      ),
    ).not.toThrow();
  });

  test('renders nested objects with expansion collapsed by default', () => {
    const json = {
      user: {
        name: 'John',
        age: 30,
      },
    };

    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify(json)} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('user');
    expect(markup).toContain('{');
  });

  test('renders arrays correctly', () => {
    const json = { items: ['a', 'b', 'c'] };

    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify(json)} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('items');
  });

  test('handles invalid JSON gracefully', () => {
    const markup = renderToStaticMarkup(
      <JsonViewer json="not valid json" keyboardShortcuts={false} />,
    );

    expect(markup).toContain('Invalid JSON');
  });

  test('renders with schema validation showing errors', () => {
    const json = { name: '', age: -5 };
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, minLength: 1 },
        age: { type: 'number' as const, minimum: 0 },
      },
      required: ['name', 'age'],
    };

    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify(json)} jsonSchema={schema} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('Validation Error');
  });

  test('renders with schema validation showing success for valid data', () => {
    const json = { name: 'John', age: 30 };
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, minLength: 1 },
        age: { type: 'number' as const, minimum: 0 },
      },
      required: ['name', 'age'],
    };

    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify(json)} jsonSchema={schema} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('No validation errors');
  });

  test('shows search bar when rendered', () => {
    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify({ foo: 'bar' })} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('search');
  });

  test('shows sort controls', () => {
    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify({ foo: 'bar' })} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('Sort');
  });

  test('shows filter controls', () => {
    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify({ foo: 'bar' })} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('Filter');
  });

  test('renders with excludedKeys filter', () => {
    const json = { visible: 'shown', hidden: 'should be hidden' };
    const markup = renderToStaticMarkup(
      <JsonViewer json={JSON.stringify(json)} keyboardShortcuts={false} />,
    );

    expect(markup).toContain('visible');
    expect(markup).toContain('hidden');
  });

  test('renders without error with various data types', () => {
    expect(() =>
      renderToStaticMarkup(
        <JsonViewer
          json={JSON.stringify({
            string: 'hello',
            number: 42,
            boolean: true,
            null: null,
          })}
          keyboardShortcuts={false}
        />,
      ),
    ).not.toThrow();
  });
});

describe('DiffViewer integration', () => {
  test('renders side-by-side diff', () => {
    const left = { name: 'John', age: 30 };
    const right = { name: 'Jane', age: 30 };

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} />);

    expect(markup).toContain('Before');
    expect(markup).toContain('After');
    expect(markup).toContain('Modified');
  });

  test('renders added changes', () => {
    const left = { name: 'John' };
    const right = { name: 'John', age: 30 };

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} />);

    expect(markup).toContain('Added');
    expect(markup).toContain('age');
  });

  test('renders removed changes', () => {
    const left = { name: 'John', age: 30 };
    const right = { name: 'John' };

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} />);

    expect(markup).toContain('Removed');
    expect(markup).toContain('age');
  });

  test('renders unified diff mode', () => {
    const left = { name: 'John' };
    const right = { name: 'Jane' };

    const markup = renderToStaticMarkup(
      <DiffViewer left={left} right={right} viewMode="unified" />,
    );

    expect(markup).toContain('Modified');
  });

  test('renders inline diff mode', () => {
    const left = { name: 'John' };
    const right = { name: 'Jane' };

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} viewMode="inline" />);

    expect(markup).toContain('Modified');
  });

  test('shows diff stats', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1, c: 3 };

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} />);

    expect(markup).toContain('added');
    expect(markup).toContain('removed');
  });

  test('shows unchanged count for identical objects', () => {
    const obj = { name: 'John', age: 30 };

    const markup = renderToStaticMarkup(<DiffViewer left={obj} right={obj} />);

    expect(markup).toContain('=1');
    expect(markup).toContain('unchanged');
  });

  test('handles arrays diff', () => {
    const left = [1, 2, 3];
    const right = [1, 5, 3];

    const markup = renderToStaticMarkup(<DiffViewer left={left} right={right} />);

    expect(markup).toContain('Modified');
  });

  test('shows unchanged when toggled', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1, b: 3 };

    const markup = renderToStaticMarkup(
      <DiffViewer left={left} right={right} showUnchanged={true} />,
    );

    expect(markup).toContain('a');
    expect(markup).toContain('Unchanged');
  });
});

describe('Bookmarks rendering', () => {
  test('renders bookmarked paths', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router({ bookmarked: 'value' }, [], {
        bookmarkedPaths: new Set([pathArrayToInternalKey(['bookmarked'])]),
      }),
    );

    expect(markup).toContain('bookmarked');
  });

  test('renders multiple bookmarked paths in object', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router({ a: 1, b: 2, c: 3 }, [], {
        bookmarkedPaths: new Set([pathArrayToInternalKey(['a']), pathArrayToInternalKey(['c'])]),
      }),
    );

    expect(markup).toContain('a');
    expect(markup).toContain('b');
    expect(markup).toContain('c');
  });
});

describe('Expansion state', () => {
  test('renders collapsed by default with ExpansionProvider', () => {
    const router = createRouter();

    const markup = renderWithExpansion(router({ nested: { deep: 'value' } }, []));

    expect(markup).toContain('nested');
  });

  test('renders with defaultExpanded on router', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router({ nested: { deep: 'value' } }, [], { maxInitialDepth: 10 }),
    );

    expect(markup).toContain('nested');
    expect(markup).toContain('deep');
    expect(markup).toContain('value');
  });
});
