# JSON Editor Usage Guide

This document explains how to use the value editing feature with schema validation for the JSON viewer.

## Overview

The editor feature allows in-place editing of JSON values with real-time schema validation. It supports editing strings, numbers, booleans, and null values.

## Basic Usage

### 1. Enable Editing in PojoViewer

```tsx
import PojoViewer from './components/json-viewer/pojo-viewer';
import { Schema } from './components/json-viewer/schema/types';

const data = {
  name: "John Doe",
  age: 30,
  active: true,
  notes: null
};

const schema: Schema = {
  root: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      age: { type: 'number', minimum: 0, maximum: 150 },
      active: { type: 'boolean' },
      notes: { type: 'null', nullable: true }
    }
  }
};

function MyComponent() {
  const handleChange = (path: string[], newValue: unknown) => {
    console.log('Value changed at path:', path, 'New value:', newValue);
    // Update your data here
  };

  return (
    <PojoViewer
      data={data}
      editable={true}
      schema={schema}
      onChange={handleChange}
      readOnly={false}
    />
  );
}
```

### 2. Using Individual Editors

You can also use the individual editor components directly:

```tsx
import { StringEditor, NumberEditor, BooleanEditor, NullEditor } from './features/editor';

// String editor
<StringEditor
  value="Hello World"
  schema={{ type: 'string', minLength: 5, maxLength: 50 }}
  onSave={(newValue) => console.log('Saved:', newValue)}
  onCancel={() => console.log('Cancelled')}
/>

// Number editor
<NumberEditor
  value={42}
  schema={{ type: 'number', minimum: 0, maximum: 100 }}
  onSave={(newValue) => console.log('Saved:', newValue)}
  onCancel={() => console.log('Cancelled')}
/>

// Boolean editor
<BooleanEditor
  value={true}
  onSave={(newValue) => console.log('Saved:', newValue)}
  onCancel={() => console.log('Cancelled')}
/>

// Null editor
<NullEditor
  value={null}
  onSave={(newValue) => console.log('Saved:', newValue)}
  onCancel={() => console.log('Cancelled')}
/>
```

### 3. Using the useJsonEditor Hook

The `useJsonEditor` hook provides undo/redo functionality:

```tsx
import { useJsonEditor } from './features/editor';

function MyComponent() {
  const initialData = { name: 'John', age: 30 };
  const { data, handleChange, undo, redo, canUndo, canRedo } = useJsonEditor(initialData);

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>

      <PojoViewer
        data={data}
        editable={true}
        onChange={handleChange}
      />
    </div>
  );
}
```

## Schema Validation

The editor validates values against schema constraints in real-time:

### String Validation
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: Regular expression pattern
- `enum`: List of allowed values

### Number Validation
- `minimum`: Minimum value (inclusive)
- `maximum`: Maximum value (inclusive)
- `multipleOf`: Number must be a multiple of this value
- `enum`: List of allowed values

### Boolean Validation
- No additional constraints (always valid true/false)

### Null Validation
- No additional constraints (always valid null)

## UI Behavior

1. **Edit Button**: Hover over a value to see the pencil icon edit button
2. **Edit Mode**: Click the edit button to enter edit mode
3. **Validation**: Real-time validation shows errors below the input
4. **Save**: Click the green checkmark or press Enter to save
5. **Cancel**: Click the red X or press Escape to cancel
6. **Read-only**: Set `readOnly={true}` to disable editing

## Validation Errors

When a value fails validation, an error message is displayed:

```tsx
// Example validation error for string length
{
  path: ['name'],
  message: 'String length 2 is less than minimum 5',
  expected: 'length >= 5',
  actual: 'length = 2',
  rule: 'minLength'
}
```

## Props Reference

### PojoViewer Props
- `editable?: boolean` - Enable editing mode (default: false)
- `schema?: Schema` - Schema for validation
- `onChange?: (path: string[], newValue: unknown) => void` - Change handler
- `readOnly?: boolean` - Make viewer read-only (default: false)

### Editor Component Props
- `value: T` - Current value
- `schema?: SchemaNode` - Schema for validation
- `onSave: (value: T) => void` - Save handler
- `onCancel: () => void` - Cancel handler
- `readOnly?: boolean` - Disable editing (default: false)

## Example: Complete Integration

```tsx
import { useState } from 'react';
import PojoViewer from './components/json-viewer/pojo-viewer';
import { Schema } from './components/json-viewer/schema/types';
import { useJsonEditor } from './components/json-viewer/features/editor';

function JsonEditorDemo() {
  const initialData = {
    user: {
      name: "Jane Doe",
      email: "jane@example.com",
      age: 28,
      verified: true,
      bio: null
    }
  };

  const schema: Schema = {
    root: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
            age: { type: 'number', minimum: 0, maximum: 150 },
            verified: { type: 'boolean' },
            bio: { type: 'null', nullable: true }
          }
        }
      }
    }
  };

  const { data, handleChange, undo, redo, canUndo, canRedo } = useJsonEditor(initialData);

  return (
    <div>
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
      </div>

      <PojoViewer
        data={data}
        editable={true}
        schema={schema}
        onChange={handleChange}
      />

      <div className="output">
        <h3>Current Data:</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
```

## Notes

- Editing only works for primitive values (string, number, boolean, null)
- Objects and arrays cannot be edited directly
- Validation errors prevent saving invalid values
- The edit button appears on hover when `editable={true}`
- Schema validation is optional but recommended
