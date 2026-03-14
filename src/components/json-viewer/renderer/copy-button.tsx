import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { stringifyUnknown } from '../utils/value-format';
import { TooltipWrapper } from './generic-renderer';

interface CopyButtonProps {
  value: unknown;
}

export function CopyButton({ value }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    const text = stringifyUnknown(value);

    void navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <TooltipWrapper tooltip={hasCopied ? 'Copied!' : 'Copy value'}>
      <Button
        variant="ghost"
        size="icon"
        className={`ml-2 h-7 w-7 transition-opacity ${
          hasCopied
            ? 'text-green-600 opacity-100 dark:text-green-400'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={handleCopy}
      >
        {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </TooltipWrapper>
  );
}
