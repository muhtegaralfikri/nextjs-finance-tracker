"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const datasetTheme = document.documentElement.dataset.theme;
  if (datasetTheme === "light" || datasetTheme === "dark") {
    return datasetTheme;
  }

  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  return prefersLight ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from light to keep SSR/CSR markup consistent; sync to preferred after mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const preferred = getPreferredTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);


  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
