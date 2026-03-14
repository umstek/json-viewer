import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import { ExpansionProvider } from '../features/expansion';
import type { Renderer } from './renderer';
import { createPathRenderer, createTypeRenderer } from './renderer';
import { createRouter } from './router';

function renderExpanded(value: unknown, renderers: Renderer[] = []) {
  const router = createRouter(renderers);

  return renderToStaticMarkup(
    <ExpansionProvider defaultExpanded>
      {router(value, [], { maxInitialDepth: 10 })}
    </ExpansionProvider>,
  );
}

describe('renderer helpers', () => {
  test('createPathRenderer matches a path and delegates nested rendering', () => {
    const markup = renderExpanded(
      {
        users: [
          {
            name: 'Ada',
            address: { city: 'Paris' },
          },
        ],
      },
      [
        createPathRenderer('$.users[*]', ({ value, path, render }) => {
          const user = value as { name: string; address: { city: string } };

          return (
            <article data-user-path={path.join('.')}>
              <h3>{user.name}</h3>
              {render(user.address, [...path, 'address'])}
            </article>
          );
        }),
      ],
    );

    expect(markup).toContain('data-user-path="users.0"');
    expect(markup).toContain('Ada');
    expect(markup).toContain('city');
    expect(markup).toContain('Paris');
  });

  test('createTypeRenderer intercepts matching values and falls through otherwise', () => {
    const markup = renderExpanded(
      {
        status: 'ok',
        name: 'Ada',
      },
      [
        createTypeRenderer(
          (value, path) => typeof value === 'string' && path[path.length - 1] === 'status',
          ({ value }) => <strong>status:{value as string}</strong>,
        ),
      ],
    );

    expect(markup).toContain('status:ok');
    expect(markup).toContain('name');
    expect(markup).toContain('Ada');
  });
});
