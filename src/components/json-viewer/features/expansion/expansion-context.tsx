import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface ExpansionContextValue {
  /** Expand all nodes */
  expandAll: () => void;
  /** Collapse all nodes */
  collapseAll: () => void;
  /** Expand nodes to a specific depth */
  expandToDepth: (depth: number) => void;
  /** Check if a path is expanded */
  isExpanded: (path: string) => boolean;
  /** Set expansion state for a specific path */
  setExpanded: (path: string, expanded: boolean) => void;
  /** Toggle expansion state for a specific path */
  toggleExpanded: (path: string) => void;
  /** Global expansion version - increments on expandAll/collapseAll to trigger re-renders */
  expansionVersion: number;
  /** Whether all nodes should be expanded (after expandAll) */
  globalExpanded: boolean | null;
  /** Target depth for expandToDepth, null means no depth limit */
  targetDepth: number | null;
}

const ExpansionContext = createContext<ExpansionContextValue | null>(null);

export interface ExpansionProviderProps {
  children: ReactNode;
  /** Initial expansion state - defaults to collapsed */
  defaultExpanded?: boolean;
}

export function ExpansionProvider({
  children,
  defaultExpanded = false,
}: ExpansionProviderProps) {
  const [expansionMap, setExpansionMap] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [expansionVersion, setExpansionVersion] = useState(0);
  const [globalExpanded, setGlobalExpanded] = useState<boolean | null>(
    defaultExpanded ? true : null,
  );
  const [targetDepth, setTargetDepth] = useState<number | null>(null);

  const expandAll = useCallback(() => {
    setExpansionMap(new Map());
    setGlobalExpanded(true);
    setTargetDepth(null);
    setExpansionVersion((v) => v + 1);
  }, []);

  const collapseAll = useCallback(() => {
    setExpansionMap(new Map());
    setGlobalExpanded(false);
    setTargetDepth(null);
    setExpansionVersion((v) => v + 1);
  }, []);

  const expandToDepth = useCallback((depth: number) => {
    setExpansionMap(new Map());
    setGlobalExpanded(true);
    setTargetDepth(depth);
    setExpansionVersion((v) => v + 1);
  }, []);

  const isExpanded = useCallback(
    (path: string) => {
      // Check individual override first
      const override = expansionMap.get(path);
      if (override !== undefined) {
        return override;
      }

      // Check depth limit
      if (targetDepth !== null) {
        const depth = path.split('.').length;
        return depth <= targetDepth;
      }

      // Fall back to global state
      return globalExpanded ?? false;
    },
    [expansionMap, globalExpanded, targetDepth],
  );

  const setExpanded = useCallback((path: string, expanded: boolean) => {
    setExpansionMap((prev) => {
      const next = new Map(prev);
      next.set(path, expanded);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((path: string) => {
    setExpansionMap((prev) => {
      const next = new Map(prev);
      const current = next.get(path);
      next.set(path, !current);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      expandAll,
      collapseAll,
      expandToDepth,
      isExpanded,
      setExpanded,
      toggleExpanded,
      expansionVersion,
      globalExpanded,
      targetDepth,
    }),
    [
      expandAll,
      collapseAll,
      expandToDepth,
      isExpanded,
      setExpanded,
      toggleExpanded,
      expansionVersion,
      globalExpanded,
      targetDepth,
    ],
  );

  return (
    <ExpansionContext.Provider value={value}>
      {children}
    </ExpansionContext.Provider>
  );
}

export function useExpansion(): ExpansionContextValue {
  const context = useContext(ExpansionContext);
  if (!context) {
    throw new Error('useExpansion must be used within an ExpansionProvider');
  }
  return context;
}

export function useOptionalExpansion(): ExpansionContextValue | null {
  return useContext(ExpansionContext);
}
