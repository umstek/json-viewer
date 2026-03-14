import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { type ExpansionContextValue, ExpansionProvider, useExpansion } from '../features/expansion';
import PojoViewer from '../pojo-viewer';
import { createDateRenderer } from './advanced/date';
import { CopyButton } from './copy-button';
import { TooltipWrapper } from './generic-renderer';

describe('renderer regressions', () => {
  test('CopyButton does not render nested buttons', () => {
    const markup = renderToStaticMarkup(<CopyButton value={{ hello: 'world' }} />);
    expect((markup.match(/<button/g) ?? []).length).toBe(1);
  });

  test('TooltipWrapper composes with PopoverTrigger without nesting buttons', () => {
    const markup = renderToStaticMarkup(
      <Popover>
        <PopoverTrigger asChild>
          <TooltipWrapper tooltip="Bookmarks">
            <Button variant="outline" size="icon">
              Open
            </Button>
          </TooltipWrapper>
        </PopoverTrigger>
      </Popover>,
    );

    expect((markup.match(/<button/g) ?? []).length).toBe(1);
  });

  test('date renderer does not wrap GenericRenderer in an extra button', () => {
    const renderer = createDateRenderer();
    const markup = renderToStaticMarkup(
      <>
        {renderer({
          value: '2024-01-02T03:04:05',
          path: ['createdAt'],
          render: () => null,
        })}
      </>,
    );

    expect((markup.match(/<button/g) ?? []).length).toBe(1);
  });

  test('text highlight treats search text literally instead of as a regex', () => {
    expect(() =>
      renderToStaticMarkup(
        <ExpansionProvider defaultExpanded>
          <PojoViewer data={{ '[meta]': 'value [x]' }} searchQuery="[" lazyLoadingEnabled={false} />
        </ExpansionProvider>,
      ),
    ).not.toThrow();
  });

  test('re-setting the same expansion state does not trigger an update loop', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let renderCount = 0;

    function ExpansionLoopProbe() {
      const expansion = useExpansion();
      renderCount += 1;

      useEffect(() => {
        expansion.setExpanded(['items'], true);
      });

      return null;
    }

    try {
      flushSync(() => {
        root.render(
          <ExpansionProvider>
            <ExpansionLoopProbe />
          </ExpansionProvider>,
        );
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(renderCount).toBe(2);
    } finally {
      flushSync(() => {
        root.unmount();
      });
      container.remove();
    }
  });

  test('toggleExpanded can collapse nodes inherited from expandAll', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let expansionApi: ExpansionContextValue | null = null;

    function ExpansionToggleProbe() {
      expansionApi = useExpansion();
      return <div data-status={expansionApi.isExpanded(['items']) ? 'open' : 'closed'} />;
    }

    try {
      flushSync(() => {
        root.render(
          <ExpansionProvider>
            <ExpansionToggleProbe />
          </ExpansionProvider>,
        );
      });

      if (!expansionApi) {
        throw new Error('Expansion context did not initialize');
      }
      const expansion = expansionApi as ExpansionContextValue;

      flushSync(() => {
        expansion.expandAll();
      });
      flushSync(() => {
        expansion.toggleExpanded(['items']);
      });

      expect(expansion.isExpanded(['items'])).toBe(false);
    } finally {
      flushSync(() => {
        root.unmount();
      });
      container.remove();
    }
  });
});
