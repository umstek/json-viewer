import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TooltipWrapper } from './generic-renderer';

interface CopyButtonProps {
  value: unknown;
}

export function CopyButton({ value }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    const jsonString = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(jsonString);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <TooltipWrapper tooltip={hasCopied ? 'Copied!' : 'Copy value'}>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleCopy}
      >
        {hasCopied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </TooltipWrapper>
  );
}
