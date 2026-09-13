"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useBubblyFonts } from "@/hooks/useBubblyFonts";
import { WidgetPicker } from "./WidgetPicker";
import { WIDGET_REGISTRY } from "./WidgetRegistry";
import { DEFAULT_WIDGET_IDS } from "./constants";

// TODO: durch echte uid aus einem Login/Auth-System ersetzen, sobald es das gibt.
const CURRENT_UID = 26;

export function DashboardPage() {
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(DEFAULT_WIDGET_IDS);
  const [message, setMessage] = useState<string | null>(null);
  useBubblyFonts();

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(`/api/message?uid=${CURRENT_UID}`);
        const data = await response.json();

        if (response.ok) {
          setMessage(data.message);
        }
      } catch {
        // Fällt unten auf den statischen Platzhalter zurück.
      }
    };

    fetchMessage();
  }, []);

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
    <>
      <style jsx global>{`
        .font-sans { font-family: "Quicksand", ui-sans-serif, system-ui, sans-serif; }
        .font-serif { font-family: "Baloo 2", ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13.5px] capitalize text-muted">{today}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[13px] font-medium text-rose">
          <Flame size={13} />0 Day Streak
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground font-serif sm:text-[38px]">
          {message ?? "Good evening."}
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
    </>
  );
}