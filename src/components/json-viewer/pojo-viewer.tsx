import { renderValue } from './renderer/router';

/**
 * A JSON viewer component that renders a plain old JavaScript object.
 *
 * @prop data - The POJO to render.
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function PojoViewer(props: { data: any }) {
  return <div>{renderValue(props.data)}</div>;
}
