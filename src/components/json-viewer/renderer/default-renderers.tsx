/**
 * Default Type Renderers
 *
 * Ordered by specificity (priority):
 * - Lower priority = more specific, checked first
 * - null (0) → boolean (10) → number (20)
 * - String formats (30-39): date-time, date, email, url, uuid, ipv4, phone
 * - string (40) - fallback
 * - array (50) → object (60)
 */

import {
  Calendar,
  CircleSlash2Icon,
  Copy,
  ExternalLink,
  Globe,
  HashIcon,
  Mail,
  Phone,
  Server,
  SlashIcon,
  TextIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getPhoneMetadata,
  validateDate,
  validateDateTime,
  validateEmail,
  validateIpv4,
  validatePhone,
  validateUrl,
  validateUuid,
} from '../validation/validators';
import { GenericRenderer, TooltipWrapper } from './generic-renderer';
import type { TypeRenderer } from './registry';

// =============================================================================
// Primitive Renderers
// =============================================================================

export const nullRenderer: TypeRenderer = {
  name: 'null',
  priority: 0,
  matches: (value) => value === null || value === undefined,
  render: () => (
    <TooltipWrapper tooltip="null">
      <GenericRenderer icon={CircleSlash2Icon} type="null" value={null}>
        <CircleSlash2Icon size={16} />
      </GenericRenderer>
    </TooltipWrapper>
  ),
};

export const booleanRenderer: TypeRenderer = {
  name: 'boolean',
  priority: 10,
  matches: (value) => typeof value === 'boolean',
  render: ({ value }) => (
    <TooltipWrapper tooltip={value ? 'true' : 'false'}>
      <GenericRenderer icon={SlashIcon} type="boolean" value={value}>
        <Checkbox checked={value as boolean} />
      </GenericRenderer>
    </TooltipWrapper>
  ),
};

export const numberRenderer: TypeRenderer = {
  name: 'number',
  priority: 20,
  matches: (value) => typeof value === 'number',
  render: ({ value }) => (
    <GenericRenderer icon={HashIcon} type="number" value={value}>
      <pre>{String(value)}</pre>
    </GenericRenderer>
  ),
};

// =============================================================================
// String Format Renderers (ordered by specificity)
// =============================================================================

export const dateTimeRenderer: TypeRenderer = {
  name: 'date-time',
  priority: 30,
  matches: (value) => typeof value === 'string' && validateDateTime(value),
  render: ({ value }) => <DateTimeDisplay value={value as string} />,
};

export const dateRenderer: TypeRenderer = {
  name: 'date',
  priority: 31,
  matches: (value) => typeof value === 'string' && validateDate(value),
  render: ({ value }) => <DateTimeDisplay value={value as string} />,
};

export const emailRenderer: TypeRenderer = {
  name: 'email',
  priority: 32,
  matches: (value) => typeof value === 'string' && validateEmail(value),
  render: ({ value }) => (
    <span className="inline-flex items-center gap-1">
      <Mail className="h-3.5 w-3.5 text-blue-500" />
      <a
        href={`mailto:${value}`}
        className="font-mono text-sm text-blue-600 hover:underline"
      >
        {value as string}
      </a>
    </span>
  ),
};

export const urlRenderer: TypeRenderer = {
  name: 'url',
  priority: 33,
  matches: (value) => typeof value === 'string' && validateUrl(value),
  render: ({ value }) => <UrlDisplay value={value as string} />,
};

export const uuidRenderer: TypeRenderer = {
  name: 'uuid',
  priority: 34,
  matches: (value) => typeof value === 'string' && validateUuid(value),
  render: ({ value }) => <UuidDisplay value={value as string} />,
};

export const ipv4Renderer: TypeRenderer = {
  name: 'ipv4',
  priority: 35,
  matches: (value) => typeof value === 'string' && validateIpv4(value),
  render: ({ value }) => <Ipv4Display value={value as string} />,
};

export const phoneRenderer: TypeRenderer = {
  name: 'phone',
  priority: 36,
  matches: (value) => typeof value === 'string' && validatePhone(value),
  render: ({ value }) => <PhoneDisplay value={value as string} />,
};

export const stringRenderer: TypeRenderer = {
  name: 'string',
  priority: 40,
  matches: (value) => typeof value === 'string',
  render: ({ value }) => (
    <GenericRenderer icon={TextIcon} type="string" value={value}>
      <pre>{value as string}</pre>
    </GenericRenderer>
  ),
};

// =============================================================================
// Structural Renderers
// =============================================================================

export const arrayRenderer: TypeRenderer = {
  name: 'array',
  priority: 50,
  matches: (value) => Array.isArray(value),
  render: ({ value, path, registry }) => (
    <ArrayDisplay value={value as unknown[]} path={path} registry={registry} />
  ),
};

export const objectRenderer: TypeRenderer = {
  name: 'object',
  priority: 60,
  matches: (value) => typeof value === 'object' && value !== null,
  render: ({ value, path, registry }) => (
    <ObjectDisplay
      value={value as Record<string, unknown>}
      path={path}
      registry={registry}
    />
  ),
};

// =============================================================================
// Display Components
// =============================================================================

function DateTimeDisplay({ value }: { value: string }) {
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

function UrlDisplay({ value }: { value: string }) {
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
              <img src={value} alt="preview" className="max-h-64 max-w-64" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}

function UuidDisplay({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm text-muted-foreground">{value}</span>
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
}

function Ipv4Display({ value }: { value: string }) {
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

function PhoneDisplay({ value }: { value: string }) {
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

// =============================================================================
// Structural Display Components
// =============================================================================

import type { RendererRegistry } from './registry';

function ArrayDisplay({
  value,
  path,
  registry,
}: {
  value: unknown[];
  path: string[];
  registry: RendererRegistry;
}) {
  if (value.length === 0) {
    return <span className="text-muted-foreground">[]</span>;
  }

  return (
    <div className="pl-4 border-l border-border">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <span className="text-muted-foreground select-none">{index}:</span>
          {registry.render(item, [...path, String(index)])}
        </div>
      ))}
    </div>
  );
}

function ObjectDisplay({
  value,
  path,
  registry,
}: {
  value: Record<string, unknown>;
  path: string[];
  registry: RendererRegistry;
}) {
  const keys = Object.keys(value);

  if (keys.length === 0) {
    return <span className="text-muted-foreground">{'{}'}</span>;
  }

  return (
    <div className="pl-4 border-l border-border">
      {keys.map((key) => (
        <div key={key} className="flex gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {key}:
          </span>
          {registry.render(value[key], [...path, key])}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Default Registry
// =============================================================================

/**
 * All default type renderers in priority order
 */
export const defaultTypeRenderers: TypeRenderer[] = [
  nullRenderer,
  booleanRenderer,
  numberRenderer,
  dateTimeRenderer,
  dateRenderer,
  emailRenderer,
  urlRenderer,
  uuidRenderer,
  ipv4Renderer,
  phoneRenderer,
  stringRenderer,
  arrayRenderer,
  objectRenderer,
];
