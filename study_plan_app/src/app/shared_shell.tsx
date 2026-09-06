"use client";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  BookOpen,
  Flame,
  BarChart2,
  Plus,
  X,
  CalendarDays,
  ClipboardList,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type Theme = "dark" | "light";
const THEME_STORAGE_KEY = "study-learn-theme";

export function useTheme() {
  // Server und der erste Client-Render starten beide vom selben festen
  // Wert ("dark") – das ist für Hydration nötig. Das echte gespeicherte/
  // bevorzugte Theme wird erst in useEffect gelesen, läuft also garantiert
  // nach der Hydration und darf sich dann gefahrlos unterscheiden.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | Theme
      | null;
    const preferred: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

// TODO: "active" sollte später über usePathname() aus next/navigation
// bestimmt werden, statt hart codiert zu sein, sobald mehr Seiten existieren.
const NAV_ITEMS: NavItem[] = [
  { label: "Today", icon: Sun, active: true },
  { label: "Study", icon: BookOpen },
  { label: "Subjects", icon: Layers },
  { label: "Streak", icon: Flame },
  { label: "Calendar", icon: CalendarDays },
  { label: "Study Plan", icon: ClipboardList },
  { label: "Analytics", icon: BarChart2 },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-[var(--scrim)] backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-panel-border bg-[var(--sidebar)] px-4 py-5 transition-transform duration-300 ease-out md:static md:z-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-300 to-accent" />
            <span className="text-[17px] font-medium tracking-tight text-foreground font-serif">
              Study Learn App
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-[var(--overlay)] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${
                active
                  ? "bg-[var(--overlay-strong)] text-foreground"
                  : "text-muted hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-accent" : "bg-transparent"
                }`}
              />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-7 px-3">
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-wider text-muted">
            Subjects
          </p>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-[var(--text-secondary)] hover:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              art
            </button>
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-muted hover:text-[var(--text-secondary)]">
              <Plus size={13} />
              New subject
            </button>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-panel-border px-1 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500" />
            <span className="text-[13px] text-[var(--text-secondary)]">
              Manar Khayi
            </span>
          </div>
          <button className="text-[12px] text-muted hover:text-[var(--text-secondary)]">
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
