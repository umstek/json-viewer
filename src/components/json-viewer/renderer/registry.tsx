/**
 * Renderer Registry
 *
 * A composable rendering system where:
 * 1. Path-based renderers take priority (JSONPath matching)
 * 2. Type-based renderers are ordered by specificity
 * 3. All renderers receive the registry to delegate rendering
 */

import type { ReactNode } from 'react';
import { matchPath } from '../utils/jsonpath';
import { defaultTypeRenderers } from './default-renderers';

/**
 * Props passed to every renderer
 */
export interface RendererProps {
  value: unknown;
  path: string[];
  registry: RendererRegistry;
}

/**
 * A renderer function that returns a ReactNode or null to skip
 */
export type RendererFn = (props: RendererProps) => ReactNode;

/**
 * Path-based renderer configuration
 */
export interface PathRenderer {
  /** JSONPath pattern to match */
  pattern: string;
  /** Renderer function */
  render: RendererFn;
}

/**
 * Type-based renderer with priority
 * Lower priority = checked first (more specific)
 */
export interface TypeRenderer {
  /** Unique name for this renderer */
  name: string;
  /** Priority (lower = more specific, checked first) */
  priority: number;
  /** Check if this renderer handles the value */
  matches: (value: unknown) => boolean;
  /** Render the value */
  render: RendererFn;
}

/**
 * Registry configuration
 */
export interface RegistryConfig {
  /** Path-based renderers (checked first) */
  pathRenderers?: PathRenderer[];
  /** Type-based renderers (ordered by priority) */
  typeRenderers?: TypeRenderer[];
}

/**
 * The renderer registry
 */
export class RendererRegistry {
  private pathRenderers: PathRenderer[];
  private typeRenderers: TypeRenderer[];

  constructor(config: RegistryConfig = {}) {
    this.pathRenderers = config.pathRenderers ?? [];
    // Sort by priority (lower first = more specific)
    this.typeRenderers = [...(config.typeRenderers ?? [])].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  /**
   * Render a value at a given path
   */
  render(value: unknown, path: string[]): ReactNode {
    // 1. Check path-based renderers first
    for (const { pattern, render } of this.pathRenderers) {
      if (matchPath(path, pattern)) {
        const result = render({ value, path, registry: this });
        if (result !== null) return result;
      }
    }

    // 2. Check type-based renderers (already sorted by priority)
    for (const { matches, render } of this.typeRenderers) {
      if (matches(value)) {
        const result = render({ value, path, registry: this });
        if (result !== null) return result;
      }
    }

    // 3. Fallback
    return <pre>{String(value)}</pre>;
  }

  /**
   * Get a type renderer by name (for customization)
   */
  getTypeRenderer(name: string): TypeRenderer | undefined {
    return this.typeRenderers.find((r) => r.name === name);
  }

  /**
   * Create a new registry with additional path renderers
   */
  withPathRenderers(renderers: PathRenderer[]): RendererRegistry {
    return new RendererRegistry({
      pathRenderers: [...renderers, ...this.pathRenderers],
      typeRenderers: this.typeRenderers,
    });
  }

  /**
   * Create a new registry with overridden type renderers
   */
  withTypeRenderers(renderers: TypeRenderer[]): RendererRegistry {
    const existing = new Map(this.typeRenderers.map((r) => [r.name, r]));
    for (const r of renderers) {
      existing.set(r.name, r);
    }
    return new RendererRegistry({
      pathRenderers: this.pathRenderers,
      typeRenderers: Array.from(existing.values()),
    });
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create the default registry with all built-in renderers
 */
export function createDefaultRegistry(): RendererRegistry {
  return new RendererRegistry({
    typeRenderers: defaultTypeRenderers,
  });
}

/**
 * Create a registry with custom path renderers
 *
 * @example
 * ```tsx
 * const registry = createRegistry({
 *   pathRenderers: [
 *     {
 *       pattern: '$.users[*]',
 *       render: ({ value, registry }) => (
 *         <UserCard user={value}>
 *           {registry.render(value.address, [...path, 'address'])}
 *         </UserCard>
 *       ),
 *     },
 *   ],
 * });
 * ```
 */
export function createRegistry(config: RegistryConfig = {}): RendererRegistry {
  return new RendererRegistry({
    pathRenderers: config.pathRenderers ?? [],
    typeRenderers: config.typeRenderers ?? defaultTypeRenderers,
  });
}
