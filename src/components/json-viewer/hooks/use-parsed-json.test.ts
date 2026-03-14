/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { useParsedJson } from './use-parsed-json';

describe('useParsedJson', () => {
  it('should parse valid JSON string', () => {
    const { result } = renderHook(() => useParsedJson('{"foo": "bar"}'));
    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBeNull();
  });

  it('should return error for invalid JSON string', () => {
    const { result } = renderHook(() => useParsedJson('invalid json'));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('JSON');
  });

  it('should only parse once per input change', () => {
    const consoleSpy = vi.spyOn(JSON, 'parse');
    const { rerender } = renderHook(({ json }: { json: string }) => useParsedJson(json), {
      initialProps: { json: '{"test": "value"}' },
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    rerender({ json: '{"test": "value"}' });
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    rerender({ json: '{"test": "new value"}' });
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
