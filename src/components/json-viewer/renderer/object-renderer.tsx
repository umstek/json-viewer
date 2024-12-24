import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';

interface ObjectRendererProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy code
  value: any;
  router: (value: unknown, path: string[]) => ReactNode;
  path: string[];
}

export function ObjectRenderer({ value, router, path }: ObjectRendererProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entries = Object.entries(value);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </CollapsibleTrigger>
        <span className="text-muted-foreground">
          {'{'}
          {!isOpen && `...${entries.length} items`}
          {!isOpen && '}'}
        </span>
        <CopyButton value={value} />
      </div>
      <CollapsibleContent>
        <div className="ml-4">
          {entries.map(([key, val]) => (
            <div key={`${path.join('.')}.${key}`} className="flex gap-2">
              <span className="text-primary">{key}:</span>
              {router(val, [...path, key])}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">{'}'}</span>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ArrayRenderer({ value, router, path }: ObjectRendererProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </CollapsibleTrigger>
        <span className="text-muted-foreground">
          {'['}
          {!isOpen && `...${value.length} items`}
          {!isOpen && ']'}
        </span>
        <CopyButton value={value} />
      </div>
      <CollapsibleContent>
        <div className="ml-4">
          {value.map((val: unknown, index: number) => (
            <div key={`${path.join('.')}.${index}`} className="flex gap-2">
              <span className="text-primary">{index}:</span>
              {router(val, [...path, String(index)])}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">{']'}</span>
      </CollapsibleContent>
    </Collapsible>
  );
}
