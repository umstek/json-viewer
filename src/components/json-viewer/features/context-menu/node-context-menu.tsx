import {
  Braces,
  ClipboardCopy,
  Copy,
  Crosshair,
  Download,
  FileText,
  Route,
  Star,
  Table,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { ExportFormat } from '../../utils/export-formats';
import { convertToFormat, exportData, formatLabels } from '../../utils/export-formats';
import { pathArrayToJsonPath, pathArrayToJsonPointer } from '../../utils/jsonpath';
import { stringifyUnknown } from '../../utils/value-format';

/** Formats available through the context menu's copy actions. */
export type ContextMenuCopyFormat =
  | 'json'
  | 'json-minified'
  | 'yaml'
  | 'csv'
  | 'json-pointer'
  | 'jsonpath'
  | 'dot-path';

export interface ContextMenuOptions {
  /** Show the bookmark item and forward clicks. */
  onBookmark?: (path: string[], value: unknown) => void;
  /** When provided, replaces the default clipboard write for all copy actions. */
  onCopy?: (format: ContextMenuCopyFormat, path: string[], value: unknown) => void;
  /** When provided, replaces the default file download for export actions. */
  onExport?: (format: ExportFormat, path: string[], value: unknown) => void;
}

const exportFormats: ExportFormat[] = ['json', 'json-minified', 'yaml', 'csv'];

/**
 * Sanitizes a single path segment for use in a filename.
 */
function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Derives a download base filename from a node path.
 * Example: ['company', 'name'] => 'company-name'
 */
export function deriveBaseFilename(path: string[]): string {
  return path.map(sanitizeSegment).filter(Boolean).join('-') || 'data';
}

/**
 * Writes text to the clipboard, tolerating environments where the
 * clipboard API is unavailable (e.g. insecure contexts).
 */
function writeClipboard(text: string): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {
    // Clipboard unavailable; ignore rather than crash.
  }
}

interface NodeContextMenuProps {
  path: string[];
  value: unknown;
  options: ContextMenuOptions;
  children: ReactNode;
}

/**
 * Wraps a tree node row with a right-click context menu offering
 * path/value copying, bookmarking, and subtree export.
 */
export function NodeContextMenu({ path, value, options, children }: NodeContextMenuProps) {
  const onBookmark = options.onBookmark;

  const copy = (format: ContextMenuCopyFormat, text: string) => {
    if (options.onCopy) {
      options.onCopy(format, path, value);
      return;
    }
    writeClipboard(text);
  };

  const handleExport = (format: ExportFormat) => {
    if (options.onExport) {
      options.onExport(format, path, value);
      return;
    }
    exportData(value, format, deriveBaseFilename(path));
  };

  return (
    <ContextMenu>
      {/*
       * Wrap in a plain div so the Radix trigger can merge its event handlers
       * onto a real DOM element. Renderer components do not forward unknown
       * props, so handing them over directly would silently drop the
       * `onContextMenu` handler.
       */}
      <ContextMenuTrigger asChild>
        <div>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => copy('jsonpath', pathArrayToJsonPath(path))}>
          <Route />
          Copy JSONPath
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copy('json-pointer', pathArrayToJsonPointer(path))}>
          <Crosshair />
          Copy JSON Pointer
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copy('dot-path', path.join('.'))}>
          <Copy />
          Copy path
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copy('json', stringifyUnknown(value))}>
          <ClipboardCopy />
          Copy value
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy />
            Copy as
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {exportFormats.map((format) => (
              <ContextMenuItem
                key={format}
                onSelect={() => copy(format, convertToFormat(value, format))}
              >
                {format === 'json' || format === 'json-minified' ? <Braces /> : null}
                {format === 'yaml' ? <FileText /> : null}
                {format === 'csv' ? <Table /> : null}
                {formatLabels[format]}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        {onBookmark && (
          <ContextMenuItem onSelect={() => onBookmark(path, value)}>
            <Star />
            Bookmark this node
          </ContextMenuItem>
        )}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Download />
            Export subtree
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {exportFormats.map((format) => (
              <ContextMenuItem key={format} onSelect={() => handleExport(format)}>
                {format === 'json' || format === 'json-minified' ? <Braces /> : null}
                {format === 'yaml' ? <FileText /> : null}
                {format === 'csv' ? <Table /> : null}
                {formatLabels[format]}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
