import { CircleSlash2Icon, HashIcon, SlashIcon, TextIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { GenericRenderer, TooltipWrapper } from './generic-renderer';

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
export function StringRenderer(props: { value: string }) {
  return (
    <GenericRenderer icon={TextIcon} type="string">
      <pre>{props.value}</pre>
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
export function NumberRenderer(props: { value: number }) {
  return (
    <GenericRenderer icon={HashIcon} type="number">
      <pre>{props.value}</pre>
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
export function BooleanRenderer(props: { value: boolean }) {
  return (
    <TooltipWrapper tooltip={props.value ? 'true' : 'false'}>
      <GenericRenderer icon={SlashIcon} type="boolean">
        <Checkbox checked={props.value} />
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
export function NullRenderer() {
  return (
    <TooltipWrapper tooltip="null">
      <GenericRenderer icon={CircleSlash2Icon} type="null">
        <CircleSlash2Icon size={16} />
      </GenericRenderer>
    </TooltipWrapper>
  );
}
