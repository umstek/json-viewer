import type { ReactNode } from 'react';
import { matchPath } from '../utils/jsonpath';

export type RenderValue = (value: unknown, path?: string[]) => ReactNode;

export interface RenderProps {
  value: unknown;
  path: string[];
  render: RenderValue;
}

export type Renderer = (props: RenderProps) => ReactNode;

export function createPathRenderer(pattern: string, renderer: Renderer): Renderer {
  return (props) => {
    if (!matchPath(props.path, pattern)) {
      return null;
    }

    return renderer(props);
  };
}

export function createTypeRenderer(
  matches: (value: unknown, path: string[]) => boolean,
  renderer: Renderer,
): Renderer {
  return (props) => {
    if (!matches(props.value, props.path)) {
      return null;
    }

    return renderer(props);
  };
}
