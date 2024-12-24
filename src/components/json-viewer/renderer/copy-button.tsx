import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { TooltipWrapper } from './generic-renderer';
import { Button } from '@/components/ui/button';

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
        className="ml-2 h-7 w-7"
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
