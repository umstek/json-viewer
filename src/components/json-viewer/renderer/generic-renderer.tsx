import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GenericRenderer(props: {
  icon: LucideIcon;
  children: ReactNode;
  type: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <props.icon className="text-muted-foreground" size={16} />
      {props.children}
      <span className="text-muted-foreground text-xs">{props.type}</span>
    </div>
  );
}

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
