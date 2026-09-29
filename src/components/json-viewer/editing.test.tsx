/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, test, vi } from 'vite-plus/test';
import { useEditHistory } from './features/editor';
import JsonViewer from './index';
import { pathArrayToInternalKey } from './utils/jsonpath';

/**
 * Expands the root object by clicking its collapsible chevron trigger,
 * so primitive children (and their edit buttons) are rendered.
 */
function expandRootObject() {
  const chevron = document.querySelector('svg.lucide-chevron-right');
  fireEvent.click(chevron?.parentElement as HTMLElement);
}

describe('JsonViewer editing integration', () => {
  test('renders edit affordances on primitive nodes when editable', () => {
    render(
      <JsonViewer
        json={JSON.stringify({ name: 'Alice', age: 30 })}
        editable
        keyboardShortcuts={false}
      />,
    );

    expandRootObject();

    expect(screen.getAllByRole('button', { name: 'Edit value' }).length).toBe(2);
  });

  test('does not render edit affordances when not editable', () => {
    render(<JsonViewer json={JSON.stringify({ name: 'Alice' })} keyboardShortcuts={false} />);

    expandRootObject();

    expect(screen.queryByRole('button', { name: 'Edit value' })).toBeNull();
  });

  test('calls onChange with the edited path and value', () => {
    const onChange = vi.fn();
    render(
      <JsonViewer
        json={JSON.stringify({ name: 'Alice' })}
        editable
        onChange={onChange}
        keyboardShortcuts={false}
      />,
    );

    expandRootObject();

    fireEvent.click(screen.getByRole('button', { name: 'Edit value' }));
    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['name'], 'Bob');
  });

  test('renders undo and redo controls only when editHistory is provided', () => {
    const json = JSON.stringify({ a: 1 });
    const { rerender } = render(<JsonViewer json={json} keyboardShortcuts={false} />);

    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Redo' })).toBeNull();

    const historyHook = renderHook(() => useEditHistory({ a: 1 }));
    rerender(
      <JsonViewer json={json} keyboardShortcuts={false} editHistory={historyHook.result.current} />,
    );

    const undoButton = screen.getByRole('button', { name: 'Undo' });
    expect(undoButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Redo' }).hasAttribute('disabled')).toBe(true);

    act(() => {
      historyHook.result.current.setValue(['a'], 2);
    });
    rerender(
      <JsonViewer json={json} keyboardShortcuts={false} editHistory={historyHook.result.current} />,
    );

    expect(screen.getByRole('button', { name: 'Undo' }).hasAttribute('disabled')).toBe(false);
  });

  test('triggers editHistory undo via Ctrl+Z on the container', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const editHistory = { undo, redo, canUndo: true, canRedo: false };
    const { container, rerender } = render(
      <JsonViewer json={JSON.stringify({ name: 'Alice' })} editHistory={editHistory} />,
    );

    fireEvent.keyDown(container.firstChild as Element, { key: 'z', ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);

    rerender(
      <JsonViewer
        json={JSON.stringify({ name: 'Alice' })}
        editHistory={editHistory}
        keyboardShortcuts={false}
      />,
    );
    fireEvent.keyDown(container.firstChild as Element, { key: 'z', ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
  });
});

describe('JsonViewer bookmarkedPaths forwarding', () => {
  test('renders the star indicator only when bookmarkedPaths is provided', () => {
    const { rerender } = render(
      <JsonViewer
        json={JSON.stringify({ name: 'Alice' })}
        bookmarkedPaths={new Set([pathArrayToInternalKey(['name'])])}
        keyboardShortcuts={false}
      />,
    );

    expandRootObject();

    expect(document.querySelector('svg.lucide-star')).not.toBeNull();

    rerender(<JsonViewer json={JSON.stringify({ name: 'Alice' })} keyboardShortcuts={false} />);

    expect(document.querySelector('svg.lucide-star')).toBeNull();
  });
});

describe('JsonViewer focusedPath forwarding', () => {
  test('marks the node matching focusedPath with a focus ring', () => {
    render(
      <JsonViewer
        json={JSON.stringify({ name: 'Alice' })}
        focusedPath={['name']}
        keyboardShortcuts={false}
      />,
    );

    // focusedPath auto-reveals the node, so the root is already expanded;
    // clicking its chevron now would collapse it again.
    const focused = document.querySelector('[data-focused="true"]');
    expect(focused).not.toBeNull();
    expect(focused?.getAttribute('data-path')).toBe('name');
  });

  test('explicit focusedPath wins until the user navigates with the keyboard', () => {
    const { container } = render(
      <JsonViewer json={JSON.stringify({ company: 'Acme', other: 1 })} focusedPath={['company']} />,
    );

    // focusedPath auto-reveals the node, so the root is already expanded;
    // clicking its chevron now would collapse it again.
    expect(document.querySelector('[data-focused="true"]')?.getAttribute('data-path')).toBe(
      'company',
    );

    // Once the user starts navigating, keyboard focus takes over the ring;
    // previously the prop shadowed it forever, freezing the ring in place.
    fireEvent.keyDown(container.firstChild as Element, { key: 'ArrowDown' });
    fireEvent.keyDown(container.firstChild as Element, { key: 'ArrowDown' });

    expect(document.querySelector('[data-focused="true"]')?.getAttribute('data-path')).toBe(
      'other',
    );
    expect(document.querySelectorAll('[data-focused="true"]').length).toBe(1);

    // Escape clears keyboard focus, so the explicit prop takes over again.
    fireEvent.keyDown(container.firstChild as Element, { key: 'Escape' });

    expect(document.querySelector('[data-focused="true"]')?.getAttribute('data-path')).toBe(
      'company',
    );
  });
});

describe('JsonViewer with useEditHistory integration', () => {
  function EditableJsonViewer({ initialData }: { initialData: unknown }) {
    const history = useEditHistory(initialData);
    const [json, setJson] = useState(() => JSON.stringify(initialData));

    // Keep the json prop in sync after each edit, like a consumer would
    useEffect(() => {
      setJson(JSON.stringify(history.data));
    }, [history.data]);

    return (
      <JsonViewer
        json={json}
        editable
        onChange={history.setValue}
        editHistory={history}
        keyboardShortcuts={false}
      />
    );
  }

  test('edits a value and reverts it via the undo button', () => {
    render(<EditableJsonViewer initialData={{ name: 'Alice' }} />);

    expandRootObject();

    expect(screen.getByText('Alice')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Edit value' }));
    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Bob')).not.toBeNull();
    expect(screen.queryByText('Alice')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  test('cancels an open editing session when undo changes the value underneath', () => {
    render(<EditableJsonViewer initialData={{ name: 'Alice' }} />);

    expandRootObject();

    // Save an edit first so the undo control becomes available.
    fireEvent.click(screen.getByRole('button', { name: 'Edit value' }));
    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Bob')).not.toBeNull();

    // Reopen the editor, then undo while the editor is still open.
    fireEvent.click(screen.getByRole('button', { name: 'Edit value' }));
    expect(screen.getByDisplayValue('Bob')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    // The stale editor must be gone instead of saving 'Bob' over the undo.
    expect(screen.queryByDisplayValue('Bob')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit value' })).not.toBeNull();
    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.queryByText('Bob')).toBeNull();
  });
});
