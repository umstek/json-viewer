import { describe, expect, test } from 'vite-plus/test';
import * as publicApi from './index';

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
});
