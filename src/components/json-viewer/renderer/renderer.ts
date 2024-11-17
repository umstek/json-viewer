import type { ReactNode } from 'react';

export interface Renderer {
  match: (value: unknown, path: string[]) => boolean;
  render: (props: { value: unknown; path: string[] }) => ReactNode;
}
