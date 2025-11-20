import { Bookmark, Star, Trash2, X } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TooltipWrapper } from '../../renderer/generic-renderer';
import {
  pathArrayToJsonPath,
  pathArrayToJsonPointer,
} from '../../utils/jsonpath';

/**
 * Represents a single bookmark entry
 */
export interface BookmarkEntry {
  /** Unique identifier for the bookmark */
  id: string;
  /** User-provided name for the bookmark */
  name: string;
  /** Path as array of keys */
  path: string[];
  /** JSONPath representation of the path */
  jsonPath: string;
  /** JSON Pointer representation of the path */
  jsonPointer: string;
  /** Timestamp when bookmark was created */
  createdAt: number;
}

export interface BookmarkManagerProps {
  /** Array of current bookmarks */
  bookmarks: BookmarkEntry[];
  /** Callback when a bookmark is added */
  onAddBookmark: (bookmark: Omit<BookmarkEntry, 'id' | 'createdAt'>) => void;
  /** Callback when a bookmark is removed */
  onRemoveBookmark: (id: string) => void;
  /** Callback when a bookmark is clicked to navigate */
  onNavigateToBookmark: (path: string[]) => void;
  /** Current path to suggest for bookmarking (optional) */
  currentPath?: string[];
  /** Optional class name for styling */
  className?: string;
}

/**
 * Bookmark manager component that displays, creates, and manages bookmarks
 */
export function BookmarkManager({
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onNavigateToBookmark,
  currentPath,
  className = '',
}: BookmarkManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [customPath, setCustomPath] = useState('');

  const handleAddCurrentPath = () => {
    if (!currentPath || currentPath.length === 0) return;

    const name =
      bookmarkName || `Bookmark at ${pathArrayToJsonPath(currentPath)}`;

    onAddBookmark({
      name,
      path: currentPath,
      jsonPath: pathArrayToJsonPath(currentPath),
      jsonPointer: pathArrayToJsonPointer(currentPath),
    });

    setBookmarkName('');
  };

  const handleAddCustomPath = () => {
    if (!customPath) return;

    // Try to parse the custom path as JSONPath or JSON Pointer
    let path: string[];

    if (customPath.startsWith('/')) {
      // JSON Pointer format
      path = customPath.slice(1).split('/');
    } else if (customPath.startsWith('$')) {
      // JSONPath format - simple parsing
      const normalized = customPath.slice(1);
      path = normalized
        .split(/[.[\]]/)
        .filter((p) => p.length > 0)
        .map((p) => p.replace(/^['"]|['"]$/g, ''));
    } else {
      // Assume dot-separated path
      path = customPath.split('.');
    }

    const name = bookmarkName || `Bookmark at ${customPath}`;

    onAddBookmark({
      name,
      path,
      jsonPath: pathArrayToJsonPath(path),
      jsonPointer: pathArrayToJsonPointer(path),
    });

    setBookmarkName('');
    setCustomPath('');
  };

  const handleNavigate = (bookmark: BookmarkEntry) => {
    onNavigateToBookmark(bookmark.path);
    setIsOpen(false);
  };

  const isCurrentPathBookmarked =
    currentPath &&
    currentPath.length > 0 &&
    bookmarks.some((b) => b.path.join('.') === currentPath.join('.'));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <TooltipWrapper tooltip="Bookmarks">
          <Button variant="outline" size="icon" className={className}>
            <Bookmark className="h-4 w-4" />
            {bookmarks.length > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {bookmarks.length}
              </span>
            )}
          </Button>
        </TooltipWrapper>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Bookmarks</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Add bookmark from current path */}
          {currentPath && currentPath.length > 0 && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label className="text-xs">Bookmark Current Path</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                  {pathArrayToJsonPath(currentPath)}
                </code>
                {isCurrentPathBookmarked ? (
                  <TooltipWrapper tooltip="Already bookmarked">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled
                    >
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </Button>
                  </TooltipWrapper>
                ) : (
                  <TooltipWrapper tooltip="Bookmark this path">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddCurrentPath}
                      className="h-7 px-2"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipWrapper>
                )}
              </div>
              <Input
                placeholder="Optional: Give it a name..."
                value={bookmarkName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBookmarkName(e.target.value)
                }
                className="h-7 text-xs"
              />
            </div>
          )}

          {/* Add bookmark from custom path */}
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label className="text-xs">Bookmark Custom Path</Label>
            <Input
              placeholder="$.path.to.value or /path/to/value"
              value={customPath}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCustomPath(e.target.value)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                e.key === 'Enter' && handleAddCustomPath()
              }
              className="h-7 text-xs"
            />
            <Input
              placeholder="Optional: Give it a name..."
              value={bookmarkName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBookmarkName(e.target.value)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                e.key === 'Enter' && handleAddCustomPath()
              }
              className="h-7 text-xs"
            />
            <Button
              onClick={handleAddCustomPath}
              size="sm"
              className="h-7 w-full"
              disabled={!customPath}
            >
              Add Bookmark
            </Button>
          </div>

          {/* List of bookmarks */}
          {bookmarks.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs">Saved Bookmarks</Label>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group flex items-start gap-2 rounded-md border border-border p-2 transition-colors hover:bg-muted/50"
                  >
                    <Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                    <button
                      type="button"
                      className="flex-1 cursor-pointer space-y-1 text-left"
                      onClick={() => handleNavigate(bookmark)}
                    >
                      <div className="font-medium text-sm">{bookmark.name}</div>
                      <code className="block truncate text-muted-foreground text-xs">
                        {bookmark.jsonPath}
                      </code>
                    </button>
                    <TooltipWrapper tooltip="Remove bookmark">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveBookmark(bookmark.id)}
                        className="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TooltipWrapper>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No bookmarks yet. Add your first bookmark above!
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
