import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { KeyboardShortcut } from './types';

export interface ShortcutsHelpProps {
  /** Whether the help dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** List of keyboard shortcuts to display */
  shortcuts: KeyboardShortcut[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Formats keyboard shortcut keys for display
 */
function formatKeys(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Detect if user is on Mac
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  // Use the first key as the display key
  const key = shortcut.keys[0];
  const displayKey = formatKey(key);
  parts.push(displayKey);

  return parts.join(isMac ? '' : '+');
}

/**
 * Format individual key for display
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Escape: 'Esc',
    Enter: '↵',
    Home: 'Home',
    End: 'End',
  };

  return keyMap[key] || key.toUpperCase();
}

/**
 * Groups shortcuts by category
 */
function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): {
  [category: string]: KeyboardShortcut[];
} {
  const groups: { [category: string]: KeyboardShortcut[] } = {
    navigation: [],
    actions: [],
    search: [],
    view: [],
  };

  for (const shortcut of shortcuts) {
    // Skip duplicate show-help-alt
    if (shortcut.id === 'show-help-alt') continue;

    if (groups[shortcut.category]) {
      groups[shortcut.category].push(shortcut);
    }
  }

  return groups;
}

/**
 * Category display names
 */
const categoryNames: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  search: 'Search & Filter',
  view: 'View',
};

/**
 * Keyboard shortcuts help dialog component
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
  shortcuts,
  className = '',
}: ShortcutsHelpProps) {
  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the JSON
            viewer
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-6">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => {
              if (categoryShortcuts.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-muted-foreground text-sm">
                    {categoryNames[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {shortcut.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {shortcut.description}
                          </div>
                        </div>
                        <kbd className="ml-4 inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 font-mono text-sm shadow-sm">
                          {formatKeys(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-6 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-muted-foreground text-xs">
            <strong>Tip:</strong> Press{' '}
            <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              ?
            </kbd>{' '}
            or{' '}
            <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              Ctrl+/
            </kbd>{' '}
            anytime to view these shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Button component to trigger the shortcuts help dialog
 */
export interface ShortcutsHelpButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Optional className for styling */
  className?: string;
}

export function ShortcutsHelpButton({
  onClick,
  className = '',
}: ShortcutsHelpButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      title="Keyboard shortcuts"
      className={className}
    >
      <Keyboard className="h-4 w-4" />
    </Button>
  );
}
