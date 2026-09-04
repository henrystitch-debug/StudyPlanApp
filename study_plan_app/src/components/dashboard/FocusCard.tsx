"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FocusCard() {
  const DURATION = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleSkip = () => {
    setRunning(false);
    setSecondsLeft(DURATION);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-panel-border bg-[linear-gradient(to_bottom_right,var(--hero-from),var(--hero-to))] p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Focus Session
          </div>
          <h2 className="mb-3 text-[26px] font-semibold leading-[1.3] text-foreground font-serif sm:text-[32px]">
            Pull your desk lamp closer. 25 minutes, only art, nothing else.
          </h2>
          <p className="mb-4 text-[14.5px] leading-6 text-muted">
            The timer dims the rest of your workspace while it runs &ndash; lit up is only what
            you&apos;re actually working on.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[13px] text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-sm bg-rose" />
            art
            <ChevronRight size={12} className="rotate-90 text-muted" />
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl border border-panel-border bg-[var(--sunken)] px-8 py-6 sm:px-10">
          <span className="text-[44px] font-light tabular-nums tracking-tight text-[var(--accent-strong)] font-serif sm:text-[48px]">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Focus Round 1
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground transition-colors hover:brightness-110"
            >
              {running ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={handleSkip}
              className="rounded-full border border-panel-border bg-[var(--overlay)] px-4 py-2 text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
