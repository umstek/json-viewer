import { Filter } from 'lucide-react';
import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  forwardRef,
  type KeyboardEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FilterOptions } from '../pojo-viewer';

type FilterButtonProps = ComponentPropsWithoutRef<'button'>;

export interface FilterControlsProps extends FilterButtonProps {
  filterOptions: FilterOptions;
  onFilterChange: (key: keyof Omit<FilterOptions, 'excludedKeys'>) => void;
  excludeKeyInput: string;
  onExcludeKeyInputChange: (value: string) => void;
  onAddExcludedKey: () => void;
  onRemoveExcludedKey: (key: string) => void;
}

export const FilterControls = forwardRef<HTMLButtonElement, FilterControlsProps>(
  function FilterControls(
    {
      filterOptions: _filterOptions,
      onFilterChange: _onFilterChange,
      excludeKeyInput: _excludeKeyInput,
      onExcludeKeyInputChange: _onExcludeKeyInputChange,
      onAddExcludedKey: _onAddExcludedKey,
      onRemoveExcludedKey: _onRemoveExcludedKey,
      className,
      type = 'button',
      ...buttonProps
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground border-input bg-background inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden ${className ?? ''}`.trim()}
        aria-label="Filter"
        {...buttonProps}
      >
        <Filter className="h-4 w-4" />
      </button>
    );
  },
);

export function FilterPopoverContent({
  filterOptions,
  onFilterChange,
  excludeKeyInput,
  onExcludeKeyInputChange,
  onAddExcludedKey,
  onRemoveExcludedKey,
}: FilterControlsProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Show/Hide Types</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-strings"
              checked={filterOptions.showStrings}
              onCheckedChange={() => onFilterChange('showStrings')}
            />
            <Label htmlFor="show-strings">Strings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-numbers"
              checked={filterOptions.showNumbers}
              onCheckedChange={() => onFilterChange('showNumbers')}
            />
            <Label htmlFor="show-numbers">Numbers</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-booleans"
              checked={filterOptions.showBooleans}
              onCheckedChange={() => onFilterChange('showBooleans')}
            />
            <Label htmlFor="show-booleans">Booleans</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-null"
              checked={filterOptions.showNull}
              onCheckedChange={() => onFilterChange('showNull')}
            />
            <Label htmlFor="show-null">Null</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-objects"
              checked={filterOptions.showObjects}
              onCheckedChange={() => onFilterChange('showObjects')}
            />
            <Label htmlFor="show-objects">Objects</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-arrays"
              checked={filterOptions.showArrays}
              onCheckedChange={() => onFilterChange('showArrays')}
            />
            <Label htmlFor="show-arrays">Arrays</Label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Exclude Keys</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Key to exclude..."
            value={excludeKeyInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onExcludeKeyInputChange(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              e.key === 'Enter' && onAddExcludedKey()
            }
          />
          <Button onClick={onAddExcludedKey} size="sm">
            Add
          </Button>
        </div>
        <div className="space-y-1">
          {filterOptions.excludedKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm">{key}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveExcludedKey(key)}
                className="h-6 px-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
