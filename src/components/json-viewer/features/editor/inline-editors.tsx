/**
 * Inline editors for different JSON value types
 *
 * This module provides specialized input components for editing
 * strings, numbers, booleans, and null values with real-time validation.
 */

import { Check, X } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type {
  NumberSchemaNode,
  SchemaNode,
  StringSchemaNode,
  ValidationError,
} from '../../schema/types';
import { matchesType } from '../../schema/validator';

export interface EditorProps<T> {
  value: T;
  schema?: SchemaNode;
  onSave: (value: T) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

/**
 * Validates a value against a schema node and returns validation errors
 */
function validateValue(
  value: unknown,
  schema: SchemaNode,
): ValidationError | null {
  // Type validation
  if (!matchesType(value, schema)) {
    const actualType =
      value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    return {
      path: [],
      message: `Type mismatch: expected ${schema.type}, got ${actualType}`,
      expected: schema.type,
      actual: actualType,
      rule: 'type',
    };
  }

  // String-specific validation
  if (schema.type === 'string' && typeof value === 'string') {
    const stringSchema = schema as StringSchemaNode;

    if (
      stringSchema.minLength !== undefined &&
      value.length < stringSchema.minLength
    ) {
      return {
        path: [],
        message: `String length ${value.length} is less than minimum ${stringSchema.minLength}`,
        expected: `length >= ${stringSchema.minLength}`,
        actual: `length = ${value.length}`,
        rule: 'minLength',
      };
    }

    if (
      stringSchema.maxLength !== undefined &&
      value.length > stringSchema.maxLength
    ) {
      return {
        path: [],
        message: `String length ${value.length} is greater than maximum ${stringSchema.maxLength}`,
        expected: `length <= ${stringSchema.maxLength}`,
        actual: `length = ${value.length}`,
        rule: 'maxLength',
      };
    }

    if (stringSchema.pattern) {
      const regex = new RegExp(stringSchema.pattern);
      if (!regex.test(value)) {
        return {
          path: [],
          message: `String does not match pattern ${stringSchema.pattern}`,
          expected: `pattern: ${stringSchema.pattern}`,
          actual: value,
          rule: 'pattern',
        };
      }
    }

    if (stringSchema.enum && !stringSchema.enum.includes(value)) {
      return {
        path: [],
        message: `Value "${value}" is not in allowed values`,
        expected: `one of [${stringSchema.enum.join(', ')}]`,
        actual: value,
        rule: 'enum',
      };
    }
  }

  // Number-specific validation
  if (schema.type === 'number' && typeof value === 'number') {
    const numberSchema = schema as NumberSchemaNode;

    if (numberSchema.minimum !== undefined && value < numberSchema.minimum) {
      return {
        path: [],
        message: `Number ${value} is less than minimum ${numberSchema.minimum}`,
        expected: `>= ${numberSchema.minimum}`,
        actual: String(value),
        rule: 'minimum',
      };
    }

    if (numberSchema.maximum !== undefined && value > numberSchema.maximum) {
      return {
        path: [],
        message: `Number ${value} is greater than maximum ${numberSchema.maximum}`,
        expected: `<= ${numberSchema.maximum}`,
        actual: String(value),
        rule: 'maximum',
      };
    }

    if (
      numberSchema.multipleOf !== undefined &&
      value % numberSchema.multipleOf !== 0
    ) {
      return {
        path: [],
        message: `Number ${value} is not a multiple of ${numberSchema.multipleOf}`,
        expected: `multiple of ${numberSchema.multipleOf}`,
        actual: String(value),
        rule: 'multipleOf',
      };
    }

    if (numberSchema.enum && !numberSchema.enum.includes(value)) {
      return {
        path: [],
        message: `Value ${value} is not in allowed values`,
        expected: `one of [${numberSchema.enum.join(', ')}]`,
        actual: String(value),
        rule: 'enum',
      };
    }
  }

  return null;
}

/**
 * String editor with validation
 */
export function StringEditor({
  value,
  schema,
  onSave,
  onCancel,
  readOnly = false,
}: EditorProps<string>) {
  const [editedValue, setEditedValue] = useState(value);
  const [error, setError] = useState<ValidationError | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditedValue(newValue);

    // Validate in real-time if schema is provided
    if (schema) {
      const validationError = validateValue(newValue, schema);
      setError(validationError);
    }
  };

  const handleSave = () => {
    if (error) return; // Don't save if there's a validation error
    onSave(editedValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={editedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={readOnly}
          className={`h-8 w-64 ${error ? 'border-red-500' : ''}`}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={!!error || readOnly}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
      {error && <span className="text-red-500 text-xs">{error.message}</span>}
    </div>
  );
}

/**
 * Number editor with validation
 */
export function NumberEditor({
  value,
  schema,
  onSave,
  onCancel,
  readOnly = false,
}: EditorProps<number>) {
  const [editedValue, setEditedValue] = useState(String(value));
  const [error, setError] = useState<ValidationError | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditedValue(newValue);

    // Try to parse as number
    const numValue = Number.parseFloat(newValue);
    if (Number.isNaN(numValue) && newValue !== '' && newValue !== '-') {
      setError({
        path: [],
        message: 'Invalid number format',
        expected: 'valid number',
        actual: newValue,
        rule: 'type',
      });
      return;
    }

    // Validate against schema if provided
    if (schema && newValue !== '' && newValue !== '-') {
      const validationError = validateValue(numValue, schema);
      setError(validationError);
    } else {
      setError(null);
    }
  };

  const handleSave = () => {
    const numValue = Number.parseFloat(editedValue);
    if (Number.isNaN(numValue) || error) return;
    onSave(numValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={editedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={readOnly}
          className={`h-8 w-64 ${error ? 'border-red-500' : ''}`}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={!!error || readOnly}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
      {error && <span className="text-red-500 text-xs">{error.message}</span>}
    </div>
  );
}

/**
 * Boolean editor (checkbox or dropdown)
 */
export function BooleanEditor({
  value,
  onSave,
  onCancel,
  readOnly = false,
}: EditorProps<boolean>) {
  const [editedValue, setEditedValue] = useState(value);

  const handleSave = () => {
    onSave(editedValue);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={editedValue}
          onCheckedChange={(checked) => setEditedValue(checked === true)}
          disabled={readOnly}
        />
        <span className="text-sm">{editedValue ? 'true' : 'false'}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={readOnly}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

/**
 * Null editor (just shows a message and save/cancel buttons)
 */
export function NullEditor({
  onSave,
  onCancel,
  readOnly = false,
}: EditorProps<null>) {
  const handleSave = () => {
    onSave(null);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">null value</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={readOnly}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
