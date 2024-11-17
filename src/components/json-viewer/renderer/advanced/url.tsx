import type { Renderer } from '../renderer';

export const urlRenderer: Renderer = {
  match: (value: unknown) =>
    typeof value === 'string' && value.startsWith('http://'),
  render: ({ value }) => <a href={value as string}>{value as string}</a>,
};
