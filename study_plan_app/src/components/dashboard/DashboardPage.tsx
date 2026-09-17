"use client";

import { Flame, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DashboardCover } from "./DashboardCover";
import { WidgetPicker } from "./WidgetPicker";
import { WIDGET_REGISTRY } from "./WidgetRegistry";
import { DEFAULT_WIDGET_IDS } from "./constants";

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 17 && hour < 23) return "Good evening";
  return "Hello";
}

const ORDER_KEY = "study-plan-widget-order";
const ACTIVE_KEY = "study-plan-active-widgets";
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

// Same idea as readWidgetOrder: fall back to the defaults when nothing (or
// nothing valid) has been saved yet.
function readActiveWidgetIds(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ACTIVE_KEY) ?? "null") as
      | string[]
      | null;
    if (!saved) return DEFAULT_WIDGET_IDS;
    return saved.filter((id) => REGISTRY_ORDER.includes(id));
  } catch {
    return DEFAULT_WIDGET_IDS;
  }
}

export function DashboardPage() {
  const { userId } = useAuth();
  // Server-safe default selection, then load the viewer's own saved
  // selection once mounted (same pattern as the widget order below).
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(DEFAULT_WIDGET_IDS);
  const [activeLoaded, setActiveLoaded] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [streak, setStreak] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchUser() {
      try {
        const url = new URL("/api/user/userGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setStreak(data.user?.streak ?? 0);
        setName(data.user?.name ?? null);
      } catch (err) {
        console.error("User fetch failed:", err);
      }
    }

    async function fetchMessage() {
      try {
        const url = new URL("/api/message", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setMessage(data.message ?? null);
      } catch {
        // falls back to the name-based greeting below
      }
    }

    fetchUser();
    fetchMessage();
  }, [userId]);

  useEffect(() => {
    setActiveWidgetIds(readActiveWidgetIds());
    setActiveLoaded(true);
  }, []);

  useEffect(() => {
    if (!activeLoaded) return;
    try {
      window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeWidgetIds));
    } catch {
      /* ignore */
    }
  }, [activeWidgetIds, activeLoaded]);

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

  const greeting = getGreeting(new Date().getHours());
  const displayName = name ?? "there";

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
      <DashboardCover />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] capitalize text-muted">{today}</p>
        <div className="flex items-center gap-2.5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[13px] font-medium text-rose">
            <Flame size={13} />
            {streak ?? 0} Day Streak
          </span>
          <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
          {message ?? (
            <>
              {greeting}, <span className="text-[var(--accent-strong)]">{displayName}</span>.
            </>
          )}
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