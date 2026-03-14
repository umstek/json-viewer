import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import { ExpansionProvider } from '../features/expansion';
import { pathArrayToInternalKey } from '../utils/jsonpath';
import { createRouter } from './router';

function renderWithExpansion(content: ReactNode) {
  return renderToStaticMarkup(<ExpansionProvider defaultExpanded>{content}</ExpansionProvider>);
}

function countOccurrences(text: string, needle: RegExp): number {
  return [...text.matchAll(needle)].length;
}

describe('path representation', () => {
  const data = {
    'a.b': 'flat',
    a: { b: 'nested' },
  };

  test('highlights only the exact dotted-key path', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router(data, [], {
        highlightedPath: ['a.b'],
      }),
    );

    expect(countOccurrences(markup, /bg-yellow-100 dark:bg-yellow-900\/30/g)).toBe(1);
  });

  test('focuses only the exact dotted-key path', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router(data, [], {
        focusedPath: ['a.b'],
      }),
    );

    const container = document.createElement('div');
    container.innerHTML = markup;

    const focusedNodes = container.querySelectorAll('[data-focused="true"]');
    expect(focusedNodes).toHaveLength(1);
    expect(focusedNodes[0]?.textContent).toContain('flat');
  });

  test('bookmark matching uses canonical internal keys', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router(data, [], {
        bookmarkedPaths: new Set([pathArrayToInternalKey(['a.b'])]),
      }),
    );

    expect(countOccurrences(markup, /fill-yellow-400 text-yellow-400/g)).toBe(1);
  });
});
