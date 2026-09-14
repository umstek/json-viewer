/**
 * Value editor component that manages edit state and provides
 * type-specific editors for JSON values
 */

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SchemaNode } from '../../schema/types';
import { BooleanEditor, NullEditor, NumberEditor, StringEditor } from './inline-editors';
import { useEditHistory } from './use-edit-history';

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
            aria-label="Edit value"
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
  const { data, setValue, undo, redo, canUndo, canRedo } = useEditHistory(initialData);

  return {
    data,
    handleChange: setValue,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
