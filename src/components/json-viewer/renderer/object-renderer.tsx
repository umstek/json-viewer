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
    <Table className="border border-primary border-solid">
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
            <TableCell className="border-r text-right">
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

/**
 * A component that renders an object as a collapsible table of key-value pairs.
 *
 * Will render the given object as a collapsible table with each key-value pair
 * displayed in a separate row.
 *
 * @param {Record<string, any>} value - The object to render.
 *
 * @returns A JSX element representing the object structure.
 */
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

/**
 * A component that renders an array as a collapsible table of key-value pairs.
 *
 * Will render the given array as a collapsible table with each element
 * displayed in a separate row.
 *
 * @param {any[]} value - The array to render.
 *
 * @returns A JSX element representing the array structure.
 */
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
