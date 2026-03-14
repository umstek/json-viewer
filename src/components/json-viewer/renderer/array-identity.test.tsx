import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import { ExpansionProvider } from '../features/expansion';
import { defaultSortOptions } from '../utils/sorting';
import type { Renderer } from './renderer';
import { createRouter } from './router';

function renderWithExpansion(content: ReactNode) {
  return renderToStaticMarkup(<ExpansionProvider defaultExpanded>{content}</ExpansionProvider>);
}

describe('array canonical identity', () => {
  test('keeps source indexes in child paths when sorted', () => {
    const visitedPaths: string[] = [];

    const captureRenderer: Renderer = ({ value, path }) => {
      if (typeof value !== 'string') {
        return null;
      }

      visitedPaths.push(path.join('.'));
      return <span>{value}</span>;
    };

    const router = createRouter([captureRenderer]);

    renderWithExpansion(
      router(['zebra', 'apple'], [], {
        sortOptions: {
          ...defaultSortOptions,
          arrayItemSort: 'alphabetical',
        },
      }),
    );

    expect(visitedPaths).toEqual(['1', '0']);
  });

  test('focuses the canonical node instead of the display index', () => {
    const router = createRouter();

    const markup = renderWithExpansion(
      router(['zebra', 'apple'], [], {
        sortOptions: {
          ...defaultSortOptions,
          arrayItemSort: 'alphabetical',
        },
        focusedPath: ['1'],
      }),
    );

    const container = document.createElement('div');
    container.innerHTML = markup;

    const focusedNode = container.querySelector('[data-focused="true"]');
    expect(focusedNode).not.toBeNull();
    expect(focusedNode?.getAttribute('data-path')).toBe('1');
    expect(focusedNode?.textContent).toContain('apple');
    expect(focusedNode?.textContent).not.toContain('zebra');
  });

  test('keeps source indexes when array items are filtered', () => {
    const visitedPaths: string[] = [];

    const captureRenderer: Renderer = ({ value, path }) => {
      if (typeof value !== 'number') {
        return null;
      }

      visitedPaths.push(path.join('.'));
      return <span>{value}</span>;
    };

    const router = createRouter([captureRenderer]);

    renderWithExpansion(
      router(['skip', 10, 'skip', 20], [], {
        filterOptions: {
          showStrings: false,
          showNumbers: true,
          showBooleans: true,
          showNull: true,
          showObjects: true,
          showArrays: true,
          excludedKeys: [],
        },
        sortOptions: defaultSortOptions,
      }),
    );

    expect(visitedPaths).toEqual(['1', '3']);
  });
});
