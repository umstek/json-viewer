import {
  BracesIcon,
  BracketsIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GenericRenderer, TooltipWrapper } from './generic-renderer';
import { renderValue } from './router';

function KeyValueRenderer(props: {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  value: Record<string, any>;
  type: 'object' | 'array';
}) {
  const entries = Object.entries(props.value);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">
            <span className="text-muted-foreground text-xs">
              {props.type === 'array' ? 'Index' : 'Key'}
            </span>
          </TableHead>
          <TableHead>
            <span className="text-muted-foreground text-xs">Value</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(([key, value]) => (
          <TableRow key={key}>
            <TableCell className="text-right">
              <pre>{key}</pre>
            </TableCell>
            <TableCell>{renderValue(value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CollapsibleWrapper(props: {
  children: ReactNode;
  type: 'object' | 'array';
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>
        <TooltipWrapper tooltip={isOpen ? 'Collapse' : 'Expand'}>
          <GenericRenderer
            icon={props.type === 'array' ? BracketsIcon : BracesIcon}
            type={props.type}
          >
            {isOpen ? (
              <ChevronsDownUpIcon size={16} />
            ) : (
              <ChevronsUpDownIcon size={16} />
            )}
          </GenericRenderer>
        </TooltipWrapper>
      </CollapsibleTrigger>
      <CollapsibleContent>{props.children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ObjectRenderer(props: {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  value: Record<string, any>;
}) {
  return (
    <CollapsibleWrapper type="object">
      <KeyValueRenderer value={props.value} type="object" />
    </CollapsibleWrapper>
  );
}

export function ArrayRenderer(props: {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  value: any[];
}) {
  return (
    <CollapsibleWrapper type="array">
      <KeyValueRenderer value={props.value} type="array" />
    </CollapsibleWrapper>
  );
}
