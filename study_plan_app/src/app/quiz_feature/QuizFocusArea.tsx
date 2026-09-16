"use client";
import type { ReactNode } from "react";

// The small, toolbar-sized trigger — same footprint as the other
// document actions (Summarize, Quiz, …), just with a slow shutter pulse
// stepping outward from its border so it stands out among them. Tucks
// down a couple px while open, as if it were pressed into the panel that
// expands below it.
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
    <div className="quiz-take-btn-frame shrink-0 rounded-md">
      {[0, 1, 2].map((i) => (
        <span key={i} className="quiz-shutter-ring" style={{ animationDelay: `${i * 1.5}s` }} />
      ))}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-all duration-300 hover:bg-[var(--overlay-strong)] disabled:opacity-50 ${
          open ? "translate-y-1" : ""
        }`}
      >
        Take Quiz
      </button>
    </div>
  );
}

// The full-width panel the button above expands into — a CSS-grid
// accordion (animating grid-template-rows avoids measuring content
// height in JS), growing to the quiz's full size rather than staying
// pinned to the trigger's small footprint.
export function QuizExpandPanel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`quiz-focus-expand ${open ? "is-open" : ""}`}>
      <div>{children}</div>
    </div>
  );
}
