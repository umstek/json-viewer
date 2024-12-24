import {
  BooleanRenderer,
  NullRenderer,
  NumberRenderer,
  StringRenderer,
} from './common-renderers';
import { ArrayRenderer, ObjectRenderer } from './object-renderer';
import type { Renderer } from './renderer';

/**
 * Creates a router function that will try custom renderers first,
 * then fall back to default renderers.
 */
export function createRouter(customRenderers: Renderer[] = []) {
  return function renderValue(value: unknown, path: string[] = []) {
    // Try custom renderers first
    for (const renderer of customRenderers) {
      const result = renderer({ value, path });
      if (result !== null) return result;
    }

    // Fall back to default renderers
    if (typeof value === 'string') {
      return <StringRenderer value={value} />;
    }
    if (typeof value === 'number') {
      return <NumberRenderer value={value} />;
    }
    if (typeof value === 'boolean') {
      return <BooleanRenderer value={value} />;
    }
    if (value === null || value === undefined) {
      return <NullRenderer />;
    }
    if (Array.isArray(value)) {
      return <ArrayRenderer value={value} router={renderValue} path={path} />;
    }
    if (typeof value === 'object') {
      return <ObjectRenderer value={value} router={renderValue} path={path} />;
    }

    // Fallback for any other types
    return <pre>{String(value)}</pre>;
  };
}
