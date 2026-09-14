import { Redo2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EditHistoryController } from './use-edit-history';

export interface UndoRedoControlsProps {
  history: EditHistoryController;
  className?: string;
}

/**
 * Toolbar undo/redo buttons bound to an edit history controller
 */
export function UndoRedoControls({ history, className }: UndoRedoControlsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={history.undo}
        disabled={!history.canUndo}
        aria-label="Undo"
        title="Undo the last edit"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={history.redo}
        disabled={!history.canRedo}
        aria-label="Redo"
        title="Redo the last undone edit"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
