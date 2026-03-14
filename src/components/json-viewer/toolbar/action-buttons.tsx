import type { ReactNode } from 'react';
import { ThemeToggle } from '../features/theme';

export interface ActionButtonsProps {
  showThemeToggle: boolean;
  showShortcutsHelp: boolean;
  onShortcutsHelpClick: () => void;
  children: ReactNode;
}

export function ActionButtons({
  showThemeToggle,
  showShortcutsHelp,
  onShortcutsHelpClick,
  children,
}: ActionButtonsProps) {
  return (
    <>
      {showThemeToggle && <ThemeToggle />}
      {children}
      {showShortcutsHelp && (
        <button
          type="button"
          onClick={onShortcutsHelpClick}
          className="focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground border-input bg-background inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          aria-label="Keyboard shortcuts"
        >
          <span className="text-xs font-bold">⌘K</span>
        </button>
      )}
    </>
  );
}
