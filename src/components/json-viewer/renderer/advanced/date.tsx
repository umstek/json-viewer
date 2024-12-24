import { Temporal } from '@js-temporal/polyfill';
import { Calendar } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

export interface DateRendererOptions {
  /**
   * Minimum valid date to consider when parsing timestamps (to avoid false positives)
   * Defaults to 2000-01-01
   */
  minDate?: Date;

  /**
   * Preferred timezone for displaying dates
   * Defaults to user's local timezone
   */
  timeZone?: string;
}

export const createDateRenderer = (
  options: DateRendererOptions = {},
): Renderer => {
  const minDate = options.minDate || new Date(2000, 0, 1);
  const minTimestamp = minDate.getTime();
  const timeZone = options.timeZone || Temporal.Now.timeZoneId();

  const parseDate = (value: unknown): Temporal.ZonedDateTime | null => {
    try {
      // Try ISO string format
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        return Temporal.ZonedDateTime.from(`${value}[UTC]`).withTimeZone(
          timeZone,
        );
      }

      // Try unix timestamp (in seconds or milliseconds)
      if (
        typeof value === 'number' ||
        (typeof value === 'string' && /^\d+$/.test(value))
      ) {
        const timestamp = Number(value);
        // If timestamp is in seconds, convert to milliseconds
        const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;

        if (ms < minTimestamp) return null;

        return Temporal.ZonedDateTime.from({
          epochMilliseconds: ms,
          timeZone: 'UTC',
        }).withTimeZone(timeZone);
      }
    } catch {
      return null;
    }
    return null;
  };

  return ({ value }) => {
    const date = parseDate(value);
    if (!date) return null;

    const userTz = Temporal.Now.timeZoneId();
    const isDefaultTzDifferent = userTz !== timeZone;
    const utcDate = date.withTimeZone('UTC');

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <GenericRenderer icon={Calendar} type="date">
              <pre>{date.toString()}</pre>
            </GenericRenderer>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1 text-sm">
              <div>UTC: {utcDate.toString()}</div>
              {isDefaultTzDifferent && (
                <div>
                  {userTz}: {date.withTimeZone(userTz).toString()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
};
