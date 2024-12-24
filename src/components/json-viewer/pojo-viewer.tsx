import type { Renderer } from './renderer/renderer';
import { createRouter } from './renderer/router';

interface PojoViewerProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy code
  data: any;
  renderers?: Renderer[];
}

export default function PojoViewer({ data, renderers = [] }: PojoViewerProps) {
  const router = createRouter(renderers);
  return <div>{router(data, [])}</div>;
}
