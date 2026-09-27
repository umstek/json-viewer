import { describe, expect, expectTypeOf, test } from 'vite-plus/test';
import * as publicApi from './index';
import type { ContextMenuCopyFormat, ContextMenuOptions, EditHistoryController } from './index';

describe('public API', () => {
  test('exposes a single renderer extension model', () => {
    expect(publicApi.createPathRenderer).toBeTypeOf('function');
    expect(publicApi.createTypeRenderer).toBeTypeOf('function');
    expect(publicApi.createCodeRenderer).toBeTypeOf('function');
    expect(publicApi.createDateRenderer).toBeTypeOf('function');
    expect(publicApi.createLinkRenderer).toBeTypeOf('function');

    expect('createRegistry' in publicApi).toBe(false);
    expect('createDefaultRegistry' in publicApi).toBe(false);
    expect('RendererRegistry' in publicApi).toBe(false);
    expect('defaultTypeRenderers' in publicApi).toBe(false);
  });

  test('exposes the editor history and context menu APIs', () => {
    expect(publicApi.useEditHistory).toBeTypeOf('function');
    expect(publicApi.UndoRedoControls).toBeTypeOf('function');

    // Type-only exports: pinned at compile time by resolving them.
    expectTypeOf<EditHistoryController>().not.toBeNever();
    expectTypeOf<ContextMenuOptions>().not.toBeNever();
    expectTypeOf<ContextMenuCopyFormat>().not.toBeNever();
  });
});
