"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/components/dashboard/types";

const THEME_STORAGE_KEY = "study-learn-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const preferred: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(preferred);
  }, []);

  // Only sync the class here. Persisting on every `theme` change would let the
  // hard-coded "dark" default overwrite a stored "light" before the effect
  // above has run (worse under React StrictMode's double-invoke), so the write
  // happens in toggleTheme instead — the only place theme changes by choice.
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });

  return { theme, toggleTheme };
}
