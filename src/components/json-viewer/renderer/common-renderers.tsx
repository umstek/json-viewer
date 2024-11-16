import { CircleSlash2Icon, HashIcon, SlashIcon, TextIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { GenericRenderer, TooltipWrapper } from './generic-renderer';

export function StringRenderer(props: { value: string }) {
  return (
    <GenericRenderer icon={TextIcon} type="string">
      <pre>{props.value}</pre>
    </GenericRenderer>
  );
}

export function NumberRenderer(props: { value: number }) {
  return (
    <GenericRenderer icon={HashIcon} type="number">
      <pre>{props.value}</pre>
    </GenericRenderer>
  );
}

export function BooleanRenderer(props: { value: boolean }) {
  return (
    <TooltipWrapper tooltip={props.value ? 'true' : 'false'}>
      <GenericRenderer icon={SlashIcon} type="boolean">
        <Checkbox checked={props.value} />
      </GenericRenderer>
    </TooltipWrapper>
  );
}

export function NullRenderer() {
  return (
    <TooltipWrapper tooltip="null">
      <GenericRenderer icon={CircleSlash2Icon} type="null">
        <CircleSlash2Icon size={16} />
      </GenericRenderer>
    </TooltipWrapper>
  );
}
