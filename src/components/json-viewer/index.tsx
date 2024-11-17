import PojoViewer from './pojo-viewer';

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
export default function JsonViewer(props: { json: string }) {
  try {
    const data = JSON.parse(props.json);
    return <PojoViewer data={data} />;
  } catch (error) {
    return <div>Invalid JSON: {(error as Error).message}</div>;
  }
}
