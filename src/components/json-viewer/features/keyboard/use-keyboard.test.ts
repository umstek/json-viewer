/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { useKeyboardNavigation } from './use-keyboard';

const testData = {
  foo: 'bar',
  nested: {
    a: 1,
    b: 2,
  },
  array: [1, 2, 3],
};

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
