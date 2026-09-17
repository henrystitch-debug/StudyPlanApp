"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type StreakStats = {
  streak: number;
  longestStreak: number;
  quizzesThisWeek: number;
};

export function AnalyticsWidget() {
  const { userId } = useAuth();
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      try {
        const url = new URL("/api/streak/streakGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setStats(data.streak);
      } catch (err) {
        console.error("Failed to load streak stats:", err);
        setError("Could not load your stats.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
          <Flame size={14} />
        </span>
        <h3 className="text-[19px] font-medium text-foreground font-serif">Analytics</h3>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">Loading...</p>
      ) : error ? (
        <p className="text-[13px] text-rose">{error}</p>
      ) : stats ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-panel-border bg-[var(--sunken)] px-2 py-3">
            <Flame size={15} className="text-accent" />
            <p className="text-[18px] font-medium text-[var(--accent-strong)] font-serif">
              {stats.streak}
            </p>
            <p className="text-center text-[9.5px] uppercase tracking-wider text-muted">
              Current Streak
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-panel-border bg-[var(--sunken)] px-2 py-3">
            <Trophy size={15} className="text-accent" />
            <p className="text-[18px] font-medium text-[var(--accent-strong)] font-serif">
              {stats.longestStreak}
            </p>
            <p className="text-center text-[9.5px] uppercase tracking-wider text-muted">
              Longest Streak
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-panel-border bg-[var(--sunken)] px-2 py-3">
            <CalendarCheck size={15} className="text-accent" />
            <p className="text-[18px] font-medium text-[var(--accent-strong)] font-serif">
              {stats.quizzesThisWeek}
            </p>
            <p className="text-center text-[9.5px] uppercase tracking-wider text-muted">
              Quizzes This Week
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
          <p className="text-[14px] leading-5 text-muted">No stats yet — take a quiz to get started.</p>
        </div>
      )}
    </div>
  );
}