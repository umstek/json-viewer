/**
 * Value editor component that manages edit state and provides
 * type-specific editors for JSON values
 */

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SchemaNode } from '../../schema/types';
import {
  BooleanEditor,
  NullEditor,
  NumberEditor,
  StringEditor,
} from './inline-editors';

export interface ValueEditorProps {
  value: unknown;
  path: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}

/**
 * Value editor component that switches between view and edit mode
 */
export function ValueEditor({
  value,
  path,
  schema,
  editable = false,
  onChange,
  readOnly = false,
}: ValueEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Don't show edit button if not editable or if value is object/array
  const canEdit =
    editable &&
    !readOnly &&
    (typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null);

  if (!canEdit) {
    return null;
  }

  const handleSave = (newValue: unknown) => {
    setIsEditing(false);
    if (onChange) {
      onChange(path, newValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    // Render appropriate editor based on type
    if (typeof value === 'string') {
      return (
        <StringEditor
          value={value}
          schema={schema}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={readOnly}
        />
      );
    }
    if (typeof value === 'number') {
      return (
        <NumberEditor
          value={value}
          schema={schema}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={readOnly}
        />
      );
    }
    if (typeof value === 'boolean') {
      return (
        <BooleanEditor
          value={value}
          schema={schema}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={readOnly}
        />
      );
    }
    if (value === null) {
      return (
        <NullEditor
          value={null}
          schema={schema}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={readOnly}
        />
      );
    }
  }

  // Show edit button when not editing
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit value</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to manage JSON data editing state
 */
export function useJsonEditor(initialData: unknown) {
  const [data, setData] = useState(initialData);
  const [history, setHistory] = useState<unknown[]>([initialData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleChange = (path: string[], newValue: unknown) => {
    const newData = updateValueAtPath(data, path, newValue);
    setData(newData);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    data,
    handleChange,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

/**
 * Updates a value at a specific path in a nested object/array
 */
function updateValueAtPath(
  data: unknown,
  path: string[],
  newValue: unknown,
): unknown {
  if (path.length === 0) {
    return newValue;
  }

  if (Array.isArray(data)) {
    const index = Number.parseInt(path[0], 10);
    const newArray = [...data];
    if (path.length === 1) {
      newArray[index] = newValue;
    } else {
      newArray[index] = updateValueAtPath(data[index], path.slice(1), newValue);
    }
    return newArray;
  }

  if (typeof data === 'object' && data !== null) {
    const key = path[0];
    const newObject = { ...data } as Record<string, unknown>;
    if (path.length === 1) {
      newObject[key] = newValue;
    } else {
      newObject[key] = updateValueAtPath(
        (data as Record<string, unknown>)[key],
        path.slice(1),
        newValue,
      );
    }
    return newObject;
  }

  return data;
}
