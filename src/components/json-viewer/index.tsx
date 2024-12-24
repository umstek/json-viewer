import { useMemo } from 'react';
import PojoViewer from './pojo-viewer';
import { createDateRenderer } from './renderer/advanced/date';
import type { DateRendererOptions } from './renderer/advanced/date';
import { createLinkRenderer } from './renderer/advanced/link';

export interface JsonViewerProps {
  json: string;
  dateOptions?: DateRendererOptions;
}

/**
 * A component that renders a JSON value as a tree of JSX elements.
 *
 * Will render the given JSON string as a tree of JSX elements.
 * If the given string is not valid JSON, will render an error message.
 *
 * @param {string} json - The JSON string to render.
 *
 * @returns A JSX tree, or an error message if the JSON is invalid.
 */
export default function JsonViewer({ json, dateOptions }: JsonViewerProps) {
  const renderers = useMemo(
    () => [createDateRenderer(dateOptions), createLinkRenderer()],
    [dateOptions],
  );

  try {
    const data = JSON.parse(json);
    return <PojoViewer data={data} renderers={renderers} />;
  } catch (error) {
    return <div>Invalid JSON: {(error as Error).message}</div>;
  }
}
