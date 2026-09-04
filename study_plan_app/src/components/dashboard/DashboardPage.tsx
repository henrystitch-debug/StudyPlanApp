"use client";

import { Flame, Menu } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useBubblyFonts } from "@/hooks/useBubblyFonts";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WidgetPicker } from "./WidgetPicker";
import { WIDGET_REGISTRY } from "./WidgetRegistry";
import { DEFAULT_WIDGET_IDS } from "./constants";

export function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(DEFAULT_WIDGET_IDS);
  const { theme, toggleTheme } = useTheme();
  useBubblyFonts();

  const toggleWidget = (id: string) => {
    setActiveWidgetIds((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const activeWidgets = WIDGET_REGISTRY.filter((w) => activeWidgetIds.includes(w.id));

  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
      <style jsx global>{`
        .font-sans { font-family: "Quicksand", ui-sans-serif, system-ui, sans-serif; }
        .font-serif { font-family: "Baloo 2", ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-[13.5px] capitalize text-muted">{today}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[13px] font-medium text-rose">
              <Flame size={13} />0 Day Streak
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground font-serif sm:text-[38px]">
              Good evening, <span className="text-[var(--accent-strong)]">Manar</span>.
            </h1>
            <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
          </div>

          {activeWidgets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {activeWidgets.map((widget) => (
                <div key={widget.id} className={widget.span === "full" ? "col-span-full" : ""}>
                  {widget.render()}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-12 text-center">
              <p className="text-[14.5px] text-muted">
                Your dashboard is empty &ndash; use Customize to add what matters to you.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
