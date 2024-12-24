import { Link } from 'lucide-react';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

const LINK_PATTERNS = [
  { prefix: 'http://', protocol: 'http:' },
  { prefix: 'https://', protocol: 'https:' },
  { prefix: 'mailto:', protocol: 'mailto:' },
  { prefix: 'tel:', protocol: 'tel:' },
  { prefix: 'ftp://', protocol: 'ftp:' },
] as const;

export const createLinkRenderer =
  (): Renderer =>
  ({ value }) => {
    if (typeof value !== 'string') return null;

    try {
      // Try parsing as URL first
      const url = new URL(value);
      if (!LINK_PATTERNS.some((p) => url.protocol === p.protocol)) {
        return null;
      }
    } catch {
      // If URL parsing fails, check if it matches any of our patterns
      if (!LINK_PATTERNS.some((p) => value.startsWith(p.prefix))) {
        return null;
      }
    }

    return (
      <GenericRenderer icon={Link} type="link">
        <a
          href={value}
          className="text-accent-foreground hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      </GenericRenderer>
    );
  };
