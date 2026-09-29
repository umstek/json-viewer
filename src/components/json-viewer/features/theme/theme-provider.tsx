import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'json-viewer-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  // Storage access can throw in private-browsing modes and embedded webviews.
  let storedTheme: string | null = null;
  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Fall through to the system preference or the light default.
  }
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  // matchMedia is missing in some environments (older jsdom, embedded webviews)
  if (typeof window.matchMedia === 'function') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // Hydration-safe initialization: the server and the client's first render
  // must agree, so the initial state never reads the browser. The stored or
  // system preference is applied right after mount instead.
  const [theme, setThemeState] = useState<Theme>(defaultTheme ?? 'light');

  useEffect(() => {
    if (defaultTheme === undefined) {
      setThemeState(getInitialTheme());
    }
  }, [defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Storage can be unavailable; the in-memory theme still applies.
    }
  }, [theme, storageKey]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Supplies a ThemeContext only when no outer provider exists, so features
 * like ThemeToggle work inside a standalone JsonViewer without creating a
 * second, competing theme context when the app already provides one.
 */
export function OptionalThemeProvider({ children }: { children: ReactNode }) {
  const existing = useContext(ThemeContext);
  if (existing) {
    return <>{children}</>;
  }
  return <ThemeProvider>{children}</ThemeProvider>;
}
