"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

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
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Timer size={14} />
          </span>
          <h3 className="text-[19px] font-semibold text-foreground font-serif">Focus Session</h3>
        </div>
        <span className="text-[12px] text-muted">Round 1</span>
      </div>
      <p className="mb-4 text-[13px] leading-5 text-muted">
        25 minutes, nothing else.
      </p>

      <div className="mt-auto flex flex-col items-center gap-3 rounded-xl border border-panel-border bg-[var(--sunken)] py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <span className="text-[34px] font-light tabular-nums tracking-tight text-[var(--accent-strong)] font-serif">
          {formatTime(secondsLeft)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-accent-foreground transition-colors hover:brightness-110"
          >
            {running ? "Pause" : "Start Focus"}
          </button>
          <button
            onClick={handleSkip}
            className="rounded-full border border-panel-border bg-[var(--overlay)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}