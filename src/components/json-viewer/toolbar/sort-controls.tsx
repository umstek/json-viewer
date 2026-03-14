import { ArrowDownAZ } from 'lucide-react';
import type { ArrayItemSortMode, ObjectKeySortMode, SortOptions } from '../utils/sorting';
import { getArrayItemSortLabel, getObjectKeySortLabel } from '../utils/sorting';

export interface SortControlsProps {
  sortOptions: SortOptions;
  onObjectKeySortChange: (mode: ObjectKeySortMode) => void;
  onArrayItemSortChange: (mode: ArrayItemSortMode) => void;
}

export function SortControls({
  sortOptions: _sortOptions,
  onObjectKeySortChange: _onObjectKeySortChange,
  onArrayItemSortChange: _onArrayItemSortChange,
}: SortControlsProps) {
  return (
    <button
      type="button"
      className="focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground border-input bg-background inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
      aria-label="Sort"
    >
      <ArrowDownAZ className="h-4 w-4" />
    </button>
  );
}

export function SortPopoverContent({
  sortOptions,
  onObjectKeySortChange,
  onArrayItemSortChange,
}: SortControlsProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Sort Object Keys</h4>
        <div className="grid gap-2">
          {(['original', 'alphabetical', 'reverse-alphabetical'] as ObjectKeySortMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                className={`inline-flex h-8 items-center justify-start gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  sortOptions.objectKeySort === mode
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'border-input bg-background hover:bg-accent hover:text-accent-foreground border shadow-xs'
                }`}
                onClick={() => onObjectKeySortChange(mode)}
              >
                {getObjectKeySortLabel(mode)}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Sort Array Items</h4>
        <div className="grid gap-2">
          {(
            [
              'original',
              'ascending',
              'descending',
              'alphabetical',
              'reverse-alphabetical',
            ] as ArrayItemSortMode[]
          ).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`inline-flex h-8 items-center justify-start gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                sortOptions.arrayItemSort === mode
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground border shadow-xs'
              }`}
              onClick={() => onArrayItemSortChange(mode)}
            >
              {getArrayItemSortLabel(mode)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
