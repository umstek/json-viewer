import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vite-plus/test';
import type { FilterOptions } from '../pojo-viewer';
import { defaultSortOptions } from '../utils/sorting';
import { FilterControls } from './filter-controls';
import { SortControls } from './sort-controls';

const noop = () => undefined;

const defaultFilterOptions: FilterOptions = {
  showStrings: true,
  showNumbers: true,
  showBooleans: true,
  showNull: true,
  showObjects: true,
  showArrays: true,
  excludedKeys: [],
};

describe('toolbar trigger controls', () => {
  test('SortControls forwards button props needed by popover triggers', () => {
    const markup = renderToStaticMarkup(
      <SortControls
        sortOptions={defaultSortOptions}
        onObjectKeySortChange={noop}
        onArrayItemSortChange={noop}
        data-state="open"
        aria-expanded="true"
      />,
    );

    expect(markup).toContain('data-state="open"');
    expect(markup).toContain('aria-expanded="true"');
  });

  test('FilterControls forwards button props needed by popover triggers', () => {
    const markup = renderToStaticMarkup(
      <FilterControls
        filterOptions={defaultFilterOptions}
        onFilterChange={noop}
        excludeKeyInput=""
        onExcludeKeyInputChange={noop}
        onAddExcludedKey={noop}
        onRemoveExcludedKey={noop}
        data-state="open"
        aria-expanded="true"
      />,
    );

    expect(markup).toContain('data-state="open"');
    expect(markup).toContain('aria-expanded="true"');
  });
});
