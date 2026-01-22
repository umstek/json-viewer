import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useExpansion } from './expansion-context';

export interface ExpansionControlsProps {
  className?: string;
}

export function ExpansionControls({ className }: ExpansionControlsProps) {
  const { expandAll, collapseAll } = useExpansion();

  return (
    <TooltipProvider>
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={expandAll}
              aria-label="Expand all"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Expand all</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={collapseAll}
              aria-label="Collapse all"
            >
              <ChevronsDownUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Collapse all</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
