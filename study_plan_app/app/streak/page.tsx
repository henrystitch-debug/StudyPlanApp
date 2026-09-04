"use client";
import { useState } from "react";
import { Menu, Flame, Trophy, CalendarCheck } from "lucide-react";
import { useTheme, ThemeToggle, Sidebar } from "../shared-shell";

// TODO: Platzhalterdaten – später aus der Datenbank laden
// (z.B. aus den täglichen Study-Session-Logs berechnen), statt hart codiert.
const CURRENT_STREAK = 0;
const LONGEST_STREAK = 5;
const TOTAL_STUDY_DAYS = 12;

// Mock-Aktivität der letzten 5 Wochen (0 = kein Lernen, 1 = wenig, 2 = mittel, 3 = viel)
const ACTIVITY_WEEKS: number[][] = [
  [0, 1, 0, 2, 1, 0, 0],
  [1, 2, 3, 2, 1, 0, 1],
  [0, 0, 1, 1, 2, 3, 2],
  [2, 2, 1, 0, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0],
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function activityColor(level: number) {
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
      <Icon size={18} className="text-accent" />
      <p className="text-[22px] font-medium text-[var(--accent-strong)] font-serif">
        {value}
      </p>
      <p className="text-[11.5px] uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

export default function StreakPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
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
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
            Streak
          </h1>

          {/* Große Streak-Anzeige */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-panel-border bg-[linear-gradient(to_bottom_right,var(--hero-from),var(--hero-to))] p-8 text-center">
            <Flame size={28} className="mx-auto mb-3 text-rose" />
            <p className="text-[46px] font-medium leading-none text-[var(--accent-strong)] font-serif">
              {CURRENT_STREAK}
            </p>
            <p className="mt-2 text-[12.5px] uppercase tracking-wider text-muted">
              {CURRENT_STREAK === 1 ? "Day streak" : "Day streak"}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-5 text-muted">
              Study today to start a new streak &ndash; every focus session
              counts.
            </p>
          </div>

          {/* Kennzahlen */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Trophy} label="Longest Streak" value={LONGEST_STREAK} />
            <StatCard
              icon={CalendarCheck}
              label="Total Study Days"
              value={TOTAL_STUDY_DAYS}
            />
            <StatCard icon={Flame} label="Current Streak" value={CURRENT_STREAK} />
          </div>

          {/* Aktivitäts-Heatmap */}
          <section className="rounded-2xl border border-panel-border bg-panel p-5">
            <h2 className="mb-4 text-[15px] font-medium text-foreground font-serif">
              Activity
            </h2>
            <div className="flex flex-col gap-1.5">
              {ACTIVITY_WEEKS.map((week, wIdx) => (
                <div key={wIdx} className="flex gap-1.5">
                  {week.map((level, dIdx) => (
                    <div
                      key={dIdx}
                      className={`h-5 w-5 rounded-sm ${activityColor(level)}`}
                      title={`Level ${level}`}
                    />
                  ))}
                </div>
              ))}
              <div className="mt-1 flex gap-1.5">
                {WEEKDAY_LABELS.map((d, i) => (
                  <span
                    key={i}
                    className="w-5 text-center text-[10px] text-muted"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
