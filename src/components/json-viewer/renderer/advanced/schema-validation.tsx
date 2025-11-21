/**
 * JSON Schema validation error renderer
 *
 * This renderer displays validation errors from JSON Schema validation.
 * It shows visual indicators (error icons, red highlights) for invalid values
 * and provides detailed error messages in tooltips.
 */

import { AlertCircle, XCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ValidationError } from '../../schema/types';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

/**
 * Options for the schema validation renderer
 */
export interface SchemaValidationRendererOptions {
  /**
   * Validation errors from JSON Schema validation
   */
  validationErrors: ValidationError[];

  /**
   * Whether to show error indicators
   * Default: true
   */
  showErrors?: boolean;
}

/**
 * Finds validation errors for a specific path
 */
function findErrorsForPath(
  path: string[],
  errors: ValidationError[],
): ValidationError[] {
  const pathStr = path.join('.');
  return errors.filter((error) => {
    const errorPathStr = error.path.join('.');
    return errorPathStr === pathStr;
  });
}

/**
 * Creates a schema validation error renderer with the given options
 *
 * This renderer will display validation errors for values that don't match
 * the JSON Schema. It shows a red error icon and detailed error messages.
 */
export function createSchemaValidationRenderer(
  options: SchemaValidationRendererOptions,
): Renderer {
  const { validationErrors, showErrors = true } = options;

  return ({ value, path }) => {
    // Don't render if no errors to show
    if (!showErrors || validationErrors.length === 0) return null;

    // Find errors for this path
    const pathErrors = findErrorsForPath(path, validationErrors);

    // If no errors for this path, don't render
    if (pathErrors.length === 0) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-2">
              <GenericRenderer
                icon={AlertCircle}
                type="validation-error"
                value={value}
              >
                <div className="flex items-center gap-2 rounded bg-red-50 px-2 py-1 dark:bg-red-900/20">
                  <pre className="font-mono text-red-700 text-sm dark:text-red-300">
                    {typeof value === 'string'
                      ? `"${value}"`
                      : JSON.stringify(value)}
                  </pre>
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
              </GenericRenderer>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="flex flex-col gap-2 text-sm">
              <div className="font-semibold text-red-600 dark:text-red-400">
                Validation Error{pathErrors.length > 1 ? 's' : ''}
              </div>
              {pathErrors.map((error, index) => (
                <div
                  key={`${error.path.join('.')}-${error.rule}-${index}`}
                  className="flex flex-col gap-1 border-t pt-2"
                >
                  <div className="text-muted-foreground text-xs">
                    Rule: {error.rule}
                  </div>
                  <div>{error.message}</div>
                  {error.expected && (
                    <div className="text-xs">
                      <span className="font-semibold">Expected:</span>{' '}
                      {error.expected}
                    </div>
                  )}
                  {error.actual && (
                    <div className="text-xs">
                      <span className="font-semibold">Actual:</span>{' '}
                      {error.actual}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
}

/**
 * Creates a validation error panel component
 *
 * This displays all validation errors in a panel format,
 * useful for showing a summary of all validation issues.
 */
export function ValidationErrorPanel({
  errors,
}: {
  errors: ValidationError[];
}) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-green-700 text-sm dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
        <AlertCircle className="h-4 w-4" />
        <span>No validation errors - JSON is valid according to schema</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-center gap-2 font-semibold text-red-700 text-sm dark:text-red-300">
        <XCircle className="h-4 w-4" />
        <span>
          {errors.length} Validation Error{errors.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {errors.map((error, index) => (
          <div
            key={`${error.path.join('.')}-${error.rule}-${index}`}
            className="rounded border border-red-200 bg-white p-2 text-sm dark:border-red-800 dark:bg-gray-800"
          >
            <div className="font-mono text-muted-foreground text-xs">
              Path: {error.path.length > 0 ? error.path.join('.') : '(root)'}
            </div>
            <div className="mt-1 text-red-700 dark:text-red-300">
              {error.message}
            </div>
            <div className="mt-1 flex gap-4 text-muted-foreground text-xs">
              {error.rule && (
                <div>
                  <span className="font-semibold">Rule:</span> {error.rule}
                </div>
              )}
              {error.expected && (
                <div>
                  <span className="font-semibold">Expected:</span>{' '}
                  {error.expected}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
