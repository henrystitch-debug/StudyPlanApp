"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function activityColor(level: number) {
  if (level === -1) return "bg-transparent"; // future day — no cell shown
  if (level === 0) return "bg-[var(--overlay)]";
  if (level === 1) return "bg-accent/30";
  if (level === 2) return "bg-accent/60";
  return "bg-accent";
}

export function WeekWidget() {
  const { userId } = useAuth();
  const [activityWeeks, setActivityWeeks] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      try {
        const url = new URL("/api/streak/streakGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setActivityWeeks(data.streak?.activityWeeks ?? []);
      } catch (err) {
        console.error("Failed to load activity:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
          <CalendarCheck size={14} />
        </span>
        <h3 className="text-[19px] font-semibold text-foreground font-serif">Activity</h3>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">Loading...</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {activityWeeks.map((week, wIdx) => (
            <div key={wIdx} className="flex gap-1.5">
              {week.map((level, dIdx) => (
                <div
                  key={dIdx}
                  className={`h-4 w-4 rounded-sm ${activityColor(level)}`}
                  title={level === -1 ? "" : `${level === 0 ? "No" : level} quiz${level === 1 ? "" : "zes"}`}
                />
              ))}
            </div>
          ))}
          <div className="mt-1 flex gap-1.5">
            {WEEKDAY_LABELS.map((d, i) => (
              <span key={i} className="w-4 text-center text-[9px] text-muted">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
