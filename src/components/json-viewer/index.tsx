import { renderValue } from './renderer/router';

export default function JsonViewer(props: { json: string }) {
  try {
    const data = JSON.parse(props.json);
    return <div>{renderValue(data)}</div>;
  } catch (error) {
    return <div>Invalid JSON: {(error as Error).message}</div>;
  }
}
