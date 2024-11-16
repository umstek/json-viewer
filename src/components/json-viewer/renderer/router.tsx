import {
  BooleanRenderer,
  NullRenderer,
  NumberRenderer,
} from './common-renderers';
import { StringRenderer } from './common-renderers';
import { ArrayRenderer, ObjectRenderer } from './object-renderer';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function renderValue(value: any) {
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
    return <ArrayRenderer value={value} />;
  }
  if (typeof value === 'object') {
    return <ObjectRenderer value={value} />;
  }
}
