/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { ShortcutsHelp } from './shortcuts-help';
import type { KeyboardNavigationOptions } from './types';
import { useKeyboardNavigation } from './use-keyboard';

const testData = {
  foo: 'bar',
  nested: {
    a: 1,
    b: 2,
  },
  array: [1, 2, 3],
};

function KeyboardHarness({ options }: { options: KeyboardNavigationOptions }) {
  const keyboard = useKeyboardNavigation(testData, options);
  return (
    <div data-testid="keyboard-container" ref={keyboard.containerRef}>
      <input data-testid="keyboard-input" readOnly />
    </div>
  );
}

describe('useKeyboardNavigation', () => {
  it('should initialize with no focused path', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));
    expect(result.current.focusState.focusedPath).toBeNull();
    expect(result.current.focusState.focusedIndex).toBe(-1);
  });

  it('should extract navigable paths from data', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));
    expect(result.current.focusState.totalNodes).toBeGreaterThan(0);
    expect(result.current.focusState.navigablePaths.length).toBeGreaterThan(0);
  });

  it('should accept and store refs for keyboard actions', () => {
    const searchInputRef = { current: null };
    const exportButtonRef = { current: null };
    const bookmarksButtonRef = { current: null };

    const { result } = renderHook(() =>
      useKeyboardNavigation(testData, {
        searchInputRef,
        exportButtonRef,
        bookmarksButtonRef,
      }),
    );

    expect(result.current).toBeDefined();
    expect(result.current.containerRef).toBeDefined();
  });

  it('should accept callbacks for keyboard actions', () => {
    const onFocusChange = vi.fn();
    const onToggleExpand = vi.fn();
    const onCopy = vi.fn();

    const { result } = renderHook(() =>
      useKeyboardNavigation(testData, {
        onFocusChange,
        onToggleExpand,
        onCopy,
      }),
    );

    expect(result.current).toBeDefined();
  });

  it('should be disabled when enabled is false', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(testData, {
        enabled: false,
      }),
    );

    expect(result.current).toBeDefined();
  });

  it('should return container ref for scoping keyboard events', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should return focus state', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    expect(result.current.focusState).toBeDefined();
    expect(result.current.focusState.focusedPath).toBeNull();
    expect(result.current.focusState.focusedIndex).toBe(-1);
    expect(result.current.focusState.totalNodes).toBeGreaterThan(0);
    expect(result.current.focusState.navigablePaths).toBeDefined();
  });

  it('should return shortcuts list', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    expect(result.current.shortcuts).toBeDefined();
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
  });

  it('should allow navigating to a specific path', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    const path = ['foo'];
    const index = result.current.focusState.navigablePaths.findIndex(
      (p) => p.join('.') === path.join('.'),
    );

    if (index >= 0) {
      act(() => {
        result.current.navigateToPath(path, index);
      });

      expect(result.current.focusState.focusedPath).toEqual(path);
      expect(result.current.focusState.focusedIndex).toBe(index);
    }
  });

  it('should show and hide help panel', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    expect(result.current.showHelp).toBe(false);

    act(() => {
      result.current.setShowHelp(true);
    });
    expect(result.current.showHelp).toBe(true);

    act(() => {
      result.current.setShowHelp(false);
    });
    expect(result.current.showHelp).toBe(false);
  });
});

describe('undo and redo shortcuts', () => {
  it('should trigger onUndo on Ctrl+Z', () => {
    const onUndo = vi.fn();
    const { getByTestId } = render(<KeyboardHarness options={{ onUndo }} />);

    fireEvent.keyDown(getByTestId('keyboard-container'), { key: 'z', ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('should trigger onRedo on Ctrl+Shift+Z without triggering undo', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { getByTestId } = render(<KeyboardHarness options={{ onUndo, onRedo }} />);

    fireEvent.keyDown(getByTestId('keyboard-container'), {
      key: 'Z',
      ctrlKey: true,
      shiftKey: true,
    });

    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('should trigger onRedo on Ctrl+Y', () => {
    const onRedo = vi.fn();
    const { getByTestId } = render(<KeyboardHarness options={{ onRedo }} />);

    fireEvent.keyDown(getByTestId('keyboard-container'), { key: 'y', ctrlKey: true });

    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('should not crash when undo and redo callbacks are absent', () => {
    const { getByTestId } = render(<KeyboardHarness options={{}} />);

    expect(() => {
      fireEvent.keyDown(getByTestId('keyboard-container'), { key: 'z', ctrlKey: true });
      fireEvent.keyDown(getByTestId('keyboard-container'), {
        key: 'Z',
        ctrlKey: true,
        shiftKey: true,
      });
      fireEvent.keyDown(getByTestId('keyboard-container'), { key: 'y', ctrlKey: true });
    }).not.toThrow();
  });

  it('should ignore undo and redo shortcuts while typing in an input', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { getByTestId } = render(<KeyboardHarness options={{ onUndo, onRedo }} />);

    fireEvent.keyDown(getByTestId('keyboard-input'), { key: 'z', ctrlKey: true });
    fireEvent.keyDown(getByTestId('keyboard-input'), { key: 'Z', ctrlKey: true, shiftKey: true });

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('should list undo and redo in the shortcuts list and help dialog', () => {
    const { result } = renderHook(() => useKeyboardNavigation(testData));

    const ids = result.current.shortcuts.map((shortcut) => shortcut.id);
    expect(ids).toContain('undo');
    expect(ids).toContain('redo');
    expect(ids).toContain('redo-alt');

    render(<ShortcutsHelp open onOpenChange={() => {}} shortcuts={result.current.shortcuts} />);
    expect(screen.getByText('Undo')).not.toBeNull();
    expect(screen.getByText('Redo')).not.toBeNull();
    expect(screen.getByText('Redo (alternate)')).not.toBeNull();
  });
});
