import type { Renderer } from '../renderer';

export const dateRenderer: Renderer = {
  match: (value: unknown) =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value),
  render: ({ value }) => <pre>{value as string}</pre>,
};
