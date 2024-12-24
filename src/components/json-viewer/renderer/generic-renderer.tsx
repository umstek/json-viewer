import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CopyButton } from './copy-button';

/**
 * A component that renders a generic value type.
 *
 * Will render the given icon, children, and type as a JSX element.
 *
 * @param {LucideIcon} icon - The Lucide icon to render.
 * @param {ReactNode} children - The children to render.
 * @param {string} type - The type of value to render.
 * @param {unknown} value - The value to copy.
 *
 * @returns A JSX element representing the given value type.
 */
export function GenericRenderer(props: {
  icon: LucideIcon;
  children: ReactNode;
  type: string;
  value: unknown;
}) {
  return (
    <div className="flex items-center gap-2">
      <props.icon className="text-muted-foreground" size={16} />
      {props.children}
      <span className="text-muted-foreground text-xs">{props.type}</span>
      <CopyButton value={props.value} />
    </div>
  );
}

/**
 * A wrapper component for rendering tooltips around children elements.
 *
 * Provides a tooltip that displays the given string when the user interacts
 * with the wrapped children elements.
 *
 * @param {ReactNode} children - The elements to wrap with a tooltip.
 * @param {string} tooltip - The text to display inside the tooltip.
 *
 * @returns A JSX element with tooltip functionality.
 */
export function TooltipWrapper(props: {
  children: ReactNode;
  tooltip: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{props.children}</TooltipTrigger>
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
