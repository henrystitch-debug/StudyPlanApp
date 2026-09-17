"use client";
import { useEffect, useState } from "react";
import { Flame, Trophy, CalendarCheck, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type StreakData = {
  streak: number;
  longestStreak: number;
  quizzesThisWeek: number;
  bestScoreThisWeek: number | null;
  activityWeeks: number[][];
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function activityColor(level: number) {
  if (level === -1) return "bg-transparent"; // future day — no cell shown
  if (level === 0) return "bg-[var(--overlay)]";
  if (level === 1) return "bg-accent/30";
  if (level === 2) return "bg-accent/60";
  return "bg-accent";
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-panel-border bg-panel p-5">
      <Icon size={18} className="text-foreground" />
      <p className="text-[22px] font-medium text-[var(--accent-strong)] font-serif">
        {value}
      </p>
      <p className="text-[11.5px] uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

// Keeps things encouraging at every level rather than just reporting a number.
function weeklyMessage(quizzesThisWeek: number): string {
  if (quizzesThisWeek === 0) {
    return "No quizzes yet this week — take one today to get your streak going!";
  }
  if (quizzesThisWeek <= 2) {
    return `Nice start — ${quizzesThisWeek} quiz${quizzesThisWeek > 1 ? "zes" : ""} done this week.`;
  }
  return `You're on a roll — ${quizzesThisWeek} quizzes done this week!`;
}

export default function StreakPage() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed === false) router.replace("/login");
  }, [isAuthed, router]);

  useEffect(() => {
    if (!userId) return;

    const fetchStreak = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL("/api/streak/streakGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed loading streak data");
        }

        setStreak(data.streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreak();
  }, [userId]);

  return (
    <>
      <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        Streak
      </h1>

      {isLoading ? (
        <p className="text-[13px] text-muted">Loading streak…</p>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-6 text-center text-[13px] text-rose">
          {error}
        </div>
      ) : (
        streak && (
          <>
            <div className="relative mb-8 overflow-hidden rounded-2xl border border-panel-border bg-[linear-gradient(to_bottom_right,var(--hero-from),var(--hero-to))] p-8 text-center">
              <Flame size={28} className="mx-auto mb-3 text-foreground" />
              <p className="text-[46px] font-medium leading-none text-[var(--accent-strong)] font-serif">
                {streak.streak}
              </p>
              <p className="mt-2 text-[12.5px] uppercase tracking-wider text-muted">
                Day streak
              </p>
              <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-5 text-muted">
                {streak.streak === 0
                  ? "Study today to start a new streak — every focus session counts."
                  : streak.streak >= streak.longestStreak
                  ? "You're at your personal best — keep it going!"
                  : `Personal best: ${streak.longestStreak} days. You've got this.`}
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Trophy} label="Longest Streak" value={streak.longestStreak} />
              <StatCard
                icon={CalendarCheck}
                label="Quizzes This Week"
                value={streak.quizzesThisWeek}
              />
              <StatCard
                icon={Target}
                label="Best Score This Week"
                value={streak.bestScoreThisWeek !== null ? `${streak.bestScoreThisWeek}%` : "—"}
              />
            </div>

            <div className="mb-8 rounded-xl border border-panel-border bg-[var(--sunken)] px-4 py-3 text-center text-[13px] text-[var(--text-secondary)]">
              {weeklyMessage(streak.quizzesThisWeek)}
            </div>

            <section className="rounded-2xl border border-panel-border bg-panel p-5">
              <h2 className="mb-4 text-[15px] font-medium text-foreground font-serif">
                Activity
              </h2>
              <div className="flex flex-col gap-1.5">
                {streak.activityWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex gap-1.5">
                    {week.map((level, dIdx) => (
                      <div
                        key={dIdx}
                        className={`h-5 w-5 rounded-sm ${activityColor(level)}`}
                        title={level === -1 ? "" : `${level === 0 ? "No" : level} quiz${level === 1 ? "" : "zes"}`}
                      />
                    ))}
                  </div>
                ))}
                <div className="mt-1 flex gap-1.5">
                  {WEEKDAY_LABELS.map((d, i) => (
                    <span key={i} className="w-5 text-center text-[10px] text-muted">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </>
        )
      )}
    </>
  );
}