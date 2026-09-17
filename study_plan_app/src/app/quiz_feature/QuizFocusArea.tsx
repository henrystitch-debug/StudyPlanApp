"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

// The small, toolbar-sized trigger — same footprint and style as the
// other document actions (View summary, Summarize, …), just toggling
// label/icon between the closed and open state.
export function QuizTakeButton({
  open,
  onClick,
  disabled,
}: {
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
    >
      {open ? <EyeOff size={13} /> : <Eye size={13} />}
      {open ? "Hide quiz" : "Take Quiz"}
    </button>
  );
}

// The full-width panel the button above expands into — a CSS-grid
// accordion (animating grid-template-rows avoids having to measure
// content height in JS), growing to the quiz's full size rather than
// staying pinned to the trigger's small footprint. Scrolling tracks the
// expansion via ResizeObserver (fires only on actual size changes, driven
// by the browser's own layout pass) rather than an rAF poll that forced a
// synchronous layout read on every single frame regardless of whether
// anything had changed — that was cheap in isolation but, stacked across
// ~50 frames a second for the better part of a second right as the panel
// opens, was enough main-thread contention to visibly delay other work
// started in that window (e.g. a mode card's hover/click sound).
export function QuizExpandPanel({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;

    el.scrollIntoView({ behavior: "auto", block: "start" });

    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const overflow = rect.bottom - window.innerHeight;
      if (overflow > 0) {
        window.scrollBy({ top: overflow, left: 0, behavior: "auto" });
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [open]);

  return (
    <div ref={ref} className={`quiz-focus-expand ${open ? "is-open" : ""}`}>
      <div>{children}</div>
    </div>
  );
}
