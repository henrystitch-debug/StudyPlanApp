"use client";

import { Flame, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBubblyFonts } from "@/hooks/useBubblyFonts";
import { useTheme } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DashboardCover } from "./DashboardCover";
import { WidgetPicker } from "./WidgetPicker";
import { WIDGET_REGISTRY } from "./WidgetRegistry";
import { DEFAULT_WIDGET_IDS } from "./constants";

const ORDER_KEY = "study-plan-widget-order";
const REGISTRY_ORDER = WIDGET_REGISTRY.map((w) => w.id);

// Merge the saved order with the registry so a widget added later (not in
// an old save) still shows up, appended at the end.
function readWidgetOrder(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ORDER_KEY) ?? "[]") as string[];
    const known = saved.filter((id) => REGISTRY_ORDER.includes(id));
    const missing = REGISTRY_ORDER.filter((id) => !known.includes(id));
    return [...known, ...missing];
  } catch {
    return REGISTRY_ORDER;
  }
}

export function DashboardPage() {
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(DEFAULT_WIDGET_IDS);
  const { name } = useAuth();
  const displayName = name ?? "there";
  const { theme, toggleTheme } = useTheme();
  useBubblyFonts();

  // Server-safe default order, then load the viewer's own saved
  // arrangement once mounted (same pattern as the theme/cover settings).
  const [widgetOrder, setWidgetOrder] = useState<string[]>(REGISTRY_ORDER);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setWidgetOrder(readWidgetOrder());
    setOrderLoaded(true);
  }, []);

  useEffect(() => {
    if (!orderLoaded) return;
    try {
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(widgetOrder));
    } catch {
      /* ignore */
    }
  }, [widgetOrder, orderLoaded]);

  const toggleWidget = (id: string) => {
    setActiveWidgetIds((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const reorder = (draggedOverId: string) => {
    if (!draggedId || draggedId === draggedOverId) return;
    setWidgetOrder((prev) => {
      const from = prev.indexOf(draggedId);
      const to = prev.indexOf(draggedOverId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const widgetsById = new Map(WIDGET_REGISTRY.map((w) => [w.id, w]));
  const activeWidgets = widgetOrder
    .filter((id) => activeWidgetIds.includes(id))
    .map((id) => widgetsById.get(id)!)
    .filter(Boolean);

  return (
    <>
      <style jsx global>{`
        .font-sans { font-family: "Quicksand", ui-sans-serif, system-ui, sans-serif; }
        .font-serif { font-family: "Baloo 2", ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      <DashboardCover />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] capitalize text-muted">{today}</p>
        <div className="flex items-center gap-2.5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[13px] font-medium text-rose">
            <Flame size={13} />0 Day Streak
          </span>
          <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground font-serif sm:text-[38px]">
          Good evening, <span className="text-[var(--accent-strong)]">{displayName}</span>.
        </h1>
      </div>

      {activeWidgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {activeWidgets.map((widget) => (
            <div
              key={widget.id}
              onDragOver={(e) => {
                e.preventDefault();
                reorder(widget.id);
              }}
              onDrop={(e) => e.preventDefault()}
              className={`group/widget relative transition-opacity ${
                widget.span === "full" ? "col-span-full" : ""
              } ${draggedId === widget.id ? "opacity-40" : ""}`}
            >
              <span
                draggable
                onDragStart={(e) => {
                  setDraggedId(widget.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggedId(null)}
                title="Drag to rearrange"
                className="absolute -left-1.5 -top-1.5 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-panel-border bg-[var(--panel)] text-muted opacity-0 shadow-sm transition-opacity active:cursor-grabbing group-hover/widget:opacity-100"
              >
                <GripVertical size={13} />
              </span>
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
    </>
  );
}