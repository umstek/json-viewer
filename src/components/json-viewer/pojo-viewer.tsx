import { renderValue } from './renderer/router';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function PojoViewer(props: { data: any }) {
  return <div>{renderValue(props.data)}</div>;
}
