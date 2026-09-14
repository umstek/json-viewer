/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { useEditHistory } from './use-edit-history';

describe('useEditHistory', () => {
  it('starts with undo and redo disabled', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    expect(result.current.data).toEqual({ a: 1 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('updates data and enables undo on setValue', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue(['a'], 2);
    });

    expect(result.current.data).toEqual({ a: 2 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('restores the previous data on undo', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue(['a'], 2);
    });
    act(() => {
      result.current.undo();
    });

    expect(result.current.data).toEqual({ a: 1 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('restores undone data on redo', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue(['a'], 2);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.data).toEqual({ a: 2 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('is a no-op to undo or redo at the history bounds', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.data).toEqual({ a: 1 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('truncates the future when a new edit follows an undo', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue(['a'], 2);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.setValue(['a'], 3);
    });

    expect(result.current.data).toEqual({ a: 3 });
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });

    expect(result.current.data).toEqual({ a: 1 });
  });

  it('drops the oldest snapshots beyond maxHistory', () => {
    const { result } = renderHook(() => useEditHistory({ n: 0 }, { maxHistory: 2 }));

    act(() => {
      result.current.setValue(['n'], 1);
    });
    act(() => {
      result.current.setValue(['n'], 2);
    });
    act(() => {
      result.current.setValue(['n'], 3);
    });
    act(() => {
      result.current.setValue(['n'], 4);
    });

    expect(result.current.data).toEqual({ n: 4 });

    let undoDepth = 0;
    while (result.current.canUndo) {
      act(() => {
        result.current.undo();
      });
      undoDepth += 1;
    }

    expect(undoDepth).toBe(2);
    expect(result.current.data).toEqual({ n: 2 });
  });

  it('clears history flags and re-baselines on reset', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue(['a'], 2);
    });
    act(() => {
      result.current.reset({ b: 0 });
    });

    expect(result.current.data).toEqual({ b: 0 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });

    expect(result.current.data).toEqual({ b: 0 });
  });

  it('replaces the root value with an empty path', () => {
    const { result } = renderHook(() => useEditHistory({ a: 1 }));

    act(() => {
      result.current.setValue([], [1, 2]);
    });

    expect(result.current.data).toEqual([1, 2]);

    act(() => {
      result.current.undo();
    });

    expect(result.current.data).toEqual({ a: 1 });
  });

  it('applies immutable updates to nested paths through arrays and objects', () => {
    const initial = { a: [{ b: 'old' }, { b: 'keep' }] };
    const { result } = renderHook(() => useEditHistory(initial));

    act(() => {
      result.current.setValue(['a', '0', 'b'], 'new');
    });

    const updated = result.current.data as { a: { b: string }[] };
    expect(updated).toEqual({ a: [{ b: 'new' }, { b: 'keep' }] });
    expect(updated).not.toBe(initial);
    expect(updated.a).not.toBe(initial.a);
    expect(updated.a[0]).not.toBe(initial.a[0]);
    // Untouched siblings keep referential identity
    expect(updated.a[1]).toBe(initial.a[1]);
  });
});
