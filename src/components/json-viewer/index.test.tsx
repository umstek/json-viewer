import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import JsonViewer from './index';

describe('JsonViewer', () => {
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
});
