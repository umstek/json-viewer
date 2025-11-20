import { Check, ChevronRight, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TooltipWrapper } from '../../renderer/generic-renderer';
import {
  pathArrayToJsonPath,
  pathArrayToJsonPointer,
} from '../../utils/jsonpath';

export interface BreadcrumbNavProps {
  /**
   * The path array representing the current location in the JSON structure
   */
  path: string[];
  /**
   * Callback when a breadcrumb segment is clicked
   * Receives the path up to and including the clicked segment
   */
  onNavigate?: (path: string[]) => void;
  /**
   * Optional class name for styling
   */
  className?: string;
}

type PathFormat = 'array' | 'jsonpath' | 'json-pointer';

/**
 * Breadcrumb navigation component that displays the current path in the JSON structure
 * and allows navigation by clicking on path segments.
 */
export function BreadcrumbNav({
  path,
  onNavigate,
  className = '',
}: BreadcrumbNavProps) {
  const [copiedFormat, setCopiedFormat] = useState<PathFormat | null>(null);

  // If path is empty, show root only
  const isEmpty = path.length === 0;

  const handleSegmentClick = (index: number) => {
    if (onNavigate) {
      // Navigate to the path up to and including this segment
      const targetPath = path.slice(0, index + 1);
      onNavigate(targetPath);
    }
  };

  const handleRootClick = () => {
    if (onNavigate) {
      onNavigate([]);
    }
  };

  const copyToClipboard = async (text: string, format: PathFormat) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatPathAsArray = (pathArray: string[]): string => {
    return JSON.stringify(pathArray, null, 2);
  };

  // Don't render if path is empty (will show root only)
  if (isEmpty) {
    return null;
  }

  const jsonPath = pathArrayToJsonPath(path);
  const jsonPointer = pathArrayToJsonPointer(path);
  const arrayFormat = formatPathAsArray(path);

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-1">
        {/* Root segment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRootClick}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          root
        </Button>

        {/* Path segments */}
        {path.map((segment, index) => {
          const isLast = index === path.length - 1;
          // Use the path up to this point as a unique key
          const uniqueKey = path.slice(0, index + 1).join('.');
          return (
            <div key={uniqueKey} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSegmentClick(index)}
                className={`h-7 px-2 ${
                  isLast
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {segment}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Copy path in different formats */}
      <div className="ml-auto flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy Path
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="mb-2 font-medium text-sm">Copy Path Format</h4>
              </div>

              {/* JSONPath format */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    JSONPath
                  </span>
                  <TooltipWrapper
                    tooltip={
                      copiedFormat === 'jsonpath' ? 'Copied!' : 'Copy JSONPath'
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(jsonPath, 'jsonpath')}
                      className="h-6 px-2"
                    >
                      {copiedFormat === 'jsonpath' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipWrapper>
                </div>
                <code className="block w-full break-all rounded bg-muted px-2 py-1 text-xs">
                  {jsonPath}
                </code>
              </div>

              {/* JSON Pointer format */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    JSON Pointer (RFC 6901)
                  </span>
                  <TooltipWrapper
                    tooltip={
                      copiedFormat === 'json-pointer'
                        ? 'Copied!'
                        : 'Copy JSON Pointer'
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(jsonPointer, 'json-pointer')
                      }
                      className="h-6 px-2"
                    >
                      {copiedFormat === 'json-pointer' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipWrapper>
                </div>
                <code className="block w-full break-all rounded bg-muted px-2 py-1 text-xs">
                  {jsonPointer}
                </code>
              </div>

              {/* Array format */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Array Format
                  </span>
                  <TooltipWrapper
                    tooltip={
                      copiedFormat === 'array' ? 'Copied!' : 'Copy as Array'
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(arrayFormat, 'array')}
                      className="h-6 px-2"
                    >
                      {copiedFormat === 'array' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipWrapper>
                </div>
                <code className="block w-full break-all rounded bg-muted px-2 py-1 text-xs">
                  {arrayFormat}
                </code>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
