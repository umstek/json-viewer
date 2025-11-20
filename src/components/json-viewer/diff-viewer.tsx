import { ChevronRight, GitCompare, LayoutGrid, List } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '../ui/button';
import type { DiffNode, DiffStats, DiffType } from './utils/diff';
import { calculateDiffStats, computeDiff, filterUnchanged } from './utils/diff';

export type DiffViewMode = 'side-by-side' | 'unified' | 'inline';

export interface DiffViewerProps {
  left: unknown;
  right: unknown;
  leftLabel?: string;
  rightLabel?: string;
  viewMode?: DiffViewMode;
  showUnchanged?: boolean;
  expandDepth?: number;
}

/**
 * Get color classes based on diff type
 */
function getDiffColorClasses(type: DiffType): {
  bg: string;
  border: string;
  text: string;
} {
  switch (type) {
    case 'added':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-700 dark:text-green-300',
      };
    case 'removed':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
      };
    case 'modified':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-700 dark:text-yellow-300',
      };
    default:
      return {
        bg: 'bg-background',
        border: 'border-border',
        text: 'text-foreground',
      };
  }
}

/**
 * Get diff type label
 */
function getDiffTypeLabel(type: DiffType): string {
  switch (type) {
    case 'added':
      return '+ Added';
    case 'removed':
      return '- Removed';
    case 'modified':
      return '~ Modified';
    default:
      return '= Unchanged';
  }
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    return `{${Object.keys(value).length} props}`;
  }
  return String(value);
}

/**
 * Render diff node in side-by-side mode
 */
interface DiffNodeRendererProps {
  node: DiffNode;
  depth: number;
  expandDepth: number;
  showUnchanged: boolean;
  viewMode: DiffViewMode;
}

function DiffNodeRenderer({
  node,
  depth,
  expandDepth,
  showUnchanged,
  viewMode,
}: DiffNodeRendererProps) {
  const [isOpen, setIsOpen] = useState(depth < expandDepth);
  const colors = getDiffColorClasses(node.type);

  // Skip unchanged nodes if showUnchanged is false
  if (!showUnchanged && node.type === 'unchanged') {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;
  const isContainer =
    hasChildren ||
    (node.type !== 'unchanged' &&
      ((typeof node.leftValue === 'object' && node.leftValue !== null) ||
        (typeof node.rightValue === 'object' && node.rightValue !== null)));

  const renderKey = () => {
    if (node.key !== undefined) {
      return (
        <span className="font-semibold text-primary">
          {typeof node.key === 'number' ? `[${node.key}]` : `${node.key}`}:
        </span>
      );
    }
    return null;
  };

  const renderValue = (value: unknown, side: 'left' | 'right') => {
    if (value === undefined) {
      return <span className="text-muted-foreground italic">undefined</span>;
    }

    const formatted = formatValue(value);
    return (
      <span className="font-mono text-sm">
        {formatted}
        {side === 'left' && node.type === 'modified' && ' →'}
      </span>
    );
  };

  if (viewMode === 'side-by-side') {
    return (
      <div className={`rounded-md border ${colors.border} overflow-hidden`}>
        <div className={`${colors.bg} p-2`}>
          <div className="group flex items-center gap-2">
            {isContainer && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </CollapsibleTrigger>
              </Collapsible>
            )}
            {!isContainer && <span className="w-4" />}
            <span className={`font-semibold text-xs ${colors.text}`}>
              {getDiffTypeLabel(node.type)}
            </span>
            {renderKey()}
          </div>

          {!isContainer && (
            <div className="mt-1 ml-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Before:</span>
                {renderValue(node.leftValue, 'left')}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">After:</span>
                {renderValue(node.rightValue, 'right')}
              </div>
            </div>
          )}

          {isContainer && hasChildren && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleContent>
                <div className="mt-2 ml-6 space-y-2">
                  {node.children?.map((child, index) => (
                    <DiffNodeRenderer
                      key={`${child.key ?? index}`}
                      node={child}
                      depth={depth + 1}
                      expandDepth={expandDepth}
                      showUnchanged={showUnchanged}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'unified') {
    return (
      <div className={`rounded-md border ${colors.border} overflow-hidden`}>
        <div className={`${colors.bg} p-2`}>
          <div className="group flex items-center gap-2">
            {isContainer && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </CollapsibleTrigger>
              </Collapsible>
            )}
            {!isContainer && <span className="w-4" />}
            <span className={`font-semibold text-xs ${colors.text}`}>
              {getDiffTypeLabel(node.type)}
            </span>
            {renderKey()}
          </div>

          {!isContainer && (
            <div className="mt-1 ml-6">
              {node.type === 'removed' || node.type === 'modified' ? (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <span className="text-xs">-</span>
                  {renderValue(node.leftValue, 'left')}
                </div>
              ) : null}
              {node.type === 'added' || node.type === 'modified' ? (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <span className="text-xs">+</span>
                  {renderValue(node.rightValue, 'right')}
                </div>
              ) : null}
              {node.type === 'unchanged' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs"> </span>
                  {renderValue(node.leftValue, 'left')}
                </div>
              )}
            </div>
          )}

          {isContainer && hasChildren && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleContent>
                <div className="mt-2 ml-6 space-y-2">
                  {node.children?.map((child, index) => (
                    <DiffNodeRenderer
                      key={`${child.key ?? index}`}
                      node={child}
                      depth={depth + 1}
                      expandDepth={expandDepth}
                      showUnchanged={showUnchanged}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className="border-l-2 pl-4" style={{ borderColor: colors.border }}>
      <div className="group flex items-center gap-2">
        {isContainer && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </CollapsibleTrigger>
          </Collapsible>
        )}
        {!isContainer && <span className="w-4" />}
        <span className={`font-semibold text-xs ${colors.text}`}>
          {getDiffTypeLabel(node.type)}
        </span>
        {renderKey()}
        {!isContainer && (
          <>
            {renderValue(node.leftValue, 'left')}
            {node.type === 'modified' && (
              <>
                <span className="mx-1">→</span>
                {renderValue(node.rightValue, 'right')}
              </>
            )}
          </>
        )}
      </div>

      {isContainer && hasChildren && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className="mt-2 ml-4 space-y-2">
              {node.children?.map((child, index) => (
                <DiffNodeRenderer
                  key={`${child.key ?? index}`}
                  node={child}
                  depth={depth + 1}
                  expandDepth={expandDepth}
                  showUnchanged={showUnchanged}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

/**
 * Diff stats display component
 */
function DiffStatsDisplay({ stats }: { stats: DiffStats }) {
  return (
    <div className="flex gap-4 text-sm">
      <div className="flex items-center gap-1">
        <span className="font-semibold text-green-600 dark:text-green-400">
          +{stats.added}
        </span>
        <span className="text-muted-foreground">added</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-red-600 dark:text-red-400">
          -{stats.removed}
        </span>
        <span className="text-muted-foreground">removed</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
          ~{stats.modified}
        </span>
        <span className="text-muted-foreground">modified</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-muted-foreground">
          ={stats.unchanged}
        </span>
        <span className="text-muted-foreground">unchanged</span>
      </div>
    </div>
  );
}

/**
 * Main DiffViewer component
 */
export default function DiffViewer({
  left,
  right,
  leftLabel = 'Before',
  rightLabel = 'After',
  viewMode: initialViewMode = 'side-by-side',
  showUnchanged: initialShowUnchanged = false,
  expandDepth = 2,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<DiffViewMode>(initialViewMode);
  const [showUnchanged, setShowUnchanged] = useState(initialShowUnchanged);

  const diff = useMemo(() => computeDiff(left, right), [left, right]);
  const stats = useMemo(() => calculateDiffStats(diff), [diff]);

  const displayDiff = useMemo(() => {
    if (showUnchanged) {
      return diff;
    }
    return filterUnchanged(diff) || diff;
  }, [diff, showUnchanged]);

  return (
    <div className="w-full space-y-4">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DiffStatsDisplay stats={stats} />

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
              title="Side-by-side view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'unified' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('unified')}
              title="Unified view"
            >
              <GitCompare className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'inline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('inline')}
              title="Inline view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Show unchanged toggle */}
          <Button
            variant={showUnchanged ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowUnchanged(!showUnchanged)}
          >
            {showUnchanged ? 'Hide' : 'Show'} Unchanged
          </Button>
        </div>
      </div>

      {/* Labels for side-by-side mode */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-2 gap-4 text-center font-semibold text-sm">
          <div className="rounded-md bg-muted p-2">{leftLabel}</div>
          <div className="rounded-md bg-muted p-2">{rightLabel}</div>
        </div>
      )}

      {/* Diff content */}
      <div className="space-y-2">
        {displayDiff ? (
          <DiffNodeRenderer
            node={displayDiff}
            depth={0}
            expandDepth={expandDepth}
            showUnchanged={showUnchanged}
            viewMode={viewMode}
          />
        ) : (
          <div className="rounded-md border p-4 text-center text-muted-foreground">
            No differences found
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Export types and utilities for external use
 */
export type { DiffNode, DiffResult, DiffStats, DiffType } from './utils/diff';
export { calculateDiffStats, computeDiff, filterUnchanged } from './utils/diff';
