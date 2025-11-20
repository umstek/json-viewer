import { CircleSlash2Icon, HashIcon, SlashIcon, TextIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { ValueEditor } from '../features/editor';
import type { SchemaNode } from '../schema/types';
import { GenericRenderer, TooltipWrapper } from './generic-renderer';

export interface RendererProps {
  value: unknown;
  path?: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}

/**
 * A component that renders a string value as a JSX element.
 *
 * Will render the given string value as a JSX element.
 * If the given string is not valid JSON, will render an error message.
 *
 * @param {string} value - The string value to render.
 *
 * @returns A JSX tree.
 */
export function StringRenderer(props: {
  value: string;
  path?: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}) {
  return (
    <GenericRenderer icon={TextIcon} type="string" value={props.value}>
      <pre>{props.value}</pre>
      <ValueEditor
        value={props.value}
        path={props.path || []}
        schema={props.schema}
        editable={props.editable}
        onChange={props.onChange}
        readOnly={props.readOnly}
      />
    </GenericRenderer>
  );
}

/**
 * A component that renders a number value as a JSX element.
 *
 * Will render the given number value as a JSX element.
 *
 * @param {number} value - The number value to render.
 *
 * @returns A JSX tree.
 */
export function NumberRenderer(props: {
  value: number;
  path?: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}) {
  return (
    <GenericRenderer icon={HashIcon} type="number" value={props.value}>
      <pre>{props.value}</pre>
      <ValueEditor
        value={props.value}
        path={props.path || []}
        schema={props.schema}
        editable={props.editable}
        onChange={props.onChange}
        readOnly={props.readOnly}
      />
    </GenericRenderer>
  );
}

/**
 * A component that renders a boolean value as a JSX element.
 *
 * Will render the given boolean value as a JSX element.
 * If the given boolean is true, will render a checked checkbox.
 * If the given boolean is false, will render an unchecked checkbox.
 *
 * @param {boolean} value - The boolean value to render.
 *
 * @returns A JSX tree.
 */
export function BooleanRenderer(props: {
  value: boolean;
  path?: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}) {
  return (
    <TooltipWrapper tooltip={props.value ? 'true' : 'false'}>
      <GenericRenderer icon={SlashIcon} type="boolean" value={props.value}>
        <Checkbox checked={props.value} />
        <ValueEditor
          value={props.value}
          path={props.path || []}
          schema={props.schema}
          editable={props.editable}
          onChange={props.onChange}
          readOnly={props.readOnly}
        />
      </GenericRenderer>
    </TooltipWrapper>
  );
}

/**
 * A component that renders a null value as a JSX element.
 *
 * Will render the given null value as a JSX element.
 * Displays a tooltip indicating the value is null.
 *
 * @returns A JSX tree.
 */
export function NullRenderer(props?: {
  path?: string[];
  schema?: SchemaNode;
  editable?: boolean;
  onChange?: (path: string[], newValue: unknown) => void;
  readOnly?: boolean;
}) {
  return (
    <TooltipWrapper tooltip="null">
      <GenericRenderer icon={CircleSlash2Icon} type="null" value={null}>
        <CircleSlash2Icon size={16} />
        {props && (
          <ValueEditor
            value={null}
            path={props.path || []}
            schema={props.schema}
            editable={props.editable}
            onChange={props.onChange}
            readOnly={props.readOnly}
          />
        )}
      </GenericRenderer>
    </TooltipWrapper>
  );
}
