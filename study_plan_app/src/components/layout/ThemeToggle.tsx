"use client";

import { Sun, Moon } from "lucide-react";
import type { Theme } from "@/components/dashboard/types";

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
