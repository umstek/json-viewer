import type { ReactNode } from 'react';

export interface RenderProps {
  value: unknown;
  path: string[];
}

export type Renderer = (props: RenderProps) => ReactNode;
