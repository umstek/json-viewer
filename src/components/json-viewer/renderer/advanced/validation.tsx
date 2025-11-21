/**
 * Actionable format renderer
 *
 * Only renders formats where there's something useful to DO:
 * - email → mailto: link
 * - phone → tel: link
 * - url → clickable link
 * - date → timezone display
 * - ipv4 → segmented display
 * - uuid → copy button
 */

import {
  Calendar,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Server,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type ActionableFormat,
  detectFormat,
  getPhoneMetadata,
} from '../../validation/validators';
import type { Renderer } from '../renderer';

/**
 * Creates a renderer for actionable formats
 */
export function createActionableRenderer(): Renderer {
  return ({ value }) => {
    if (typeof value !== 'string') return null;

    const result = detectFormat(value);
    if (!result) return null;

    return <ActionableValue value={value} format={result.format} />;
  };
}

interface ActionableValueProps {
  value: string;
  format: ActionableFormat;
}

function ActionableValue({ value, format }: ActionableValueProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  switch (format) {
    case 'email':
      return (
        <span className="inline-flex items-center gap-1">
          <Mail className="h-3.5 w-3.5 text-blue-500" />
          <a
            href={`mailto:${value}`}
            className="font-mono text-sm text-blue-600 hover:underline"
          >
            {value}
          </a>
        </span>
      );

    case 'phone': {
      const meta = getPhoneMetadata(value);
      return (
        <span className="inline-flex items-center gap-1">
          <Phone className="h-3.5 w-3.5 text-green-500" />
          <a
            href={meta.uri}
            className="font-mono text-sm text-green-600 hover:underline"
          >
            {meta.formatted || value}
          </a>
        </span>
      );
    }

    case 'url': {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(value);
      return (
        <span className="inline-flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-blue-500" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-blue-600 hover:underline"
          >
            {value.length > 50 ? `${value.slice(0, 50)}...` : value}
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
          {isImage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={value}
                    alt="preview"
                    className="ml-2 h-8 w-8 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <img
                    src={value}
                    alt="preview"
                    className="max-h-64 max-w-64"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
      );
    }

    case 'date':
    case 'date-time': {
      const date = new Date(value);
      const local = date.toLocaleString();
      const utc = date.toUTCString();
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 cursor-help">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-mono text-sm">{local}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Local:</strong> {local}
                </div>
                <div>
                  <strong>UTC:</strong> {utc}
                </div>
                <div>
                  <strong>ISO:</strong> {value}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case 'ipv4': {
      const segments = value.split('.');
      return (
        <span className="inline-flex items-center gap-1">
          <Server className="h-3.5 w-3.5 text-purple-500" />
          <span className="font-mono text-sm">
            {segments.map((seg, i) => (
              <span key={i}>
                <span className="bg-purple-100 dark:bg-purple-900/30 px-1 rounded">
                  {seg}
                </span>
                {i < 3 && <span className="text-muted-foreground">.</span>}
              </span>
            ))}
          </span>
        </span>
      );
    }

    case 'uuid':
      return (
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-sm text-muted-foreground">
            {value}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={copyToClipboard}
          >
            <Copy
              className={`h-3 w-3 ${copied ? 'text-green-500' : 'text-muted-foreground'}`}
            />
          </Button>
        </span>
      );

    default:
      return null;
  }
}

export const defaultValidationRenderer = createActionableRenderer();
