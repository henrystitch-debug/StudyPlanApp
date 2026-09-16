"use client";
import { useEffect, useState } from "react";
import { getRetakeMarker, StudyMode } from "./quizCore";

// A few frame outlines loosen from an element's own border and step
// outward, fading as they go — used wherever a "correct" result appears,
// across every quiz mode. Host element needs position:relative.
const CORRECT_RING_COUNT = 4;

export function CorrectBurst() {
  return (
    <>
      {Array.from({ length: CORRECT_RING_COUNT }, (_, i) => (
        <span key={i} className="correct-ring" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </>
  );
}

// Small colored dot shown next to a question that was already answered in
// a previous session — a stand-in for real retake/study-plan tracking
// (see quizCore's getRetakeMarker comment).
export function RetakeMarkerDot({ mode, questionKey }: { mode: StudyMode; questionKey: string }) {
  const marker = getRetakeMarker(mode, questionKey);
  if (!marker) return null;
  const color =
    marker === "correct" ? "var(--score-correct)" : marker === "partly" ? "var(--score-mostly)" : "var(--score-false)";
  return (
    <span
      title={`Last attempt: ${marker}`}
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

// Plain, uncolored gauge — the needle rises from 0 to the score with a
// smooth ease-out (quick start, gradual settle, no overshoot) the moment
// it mounts, rather than snapping straight to the final reading.
// `durationMs`/`easing` let a caller stretch or reshape the rise to match
// some other in-progress animation (e.g. free text's scan glide, which
// wants the exact same accelerate/decelerate curve so the two move in
// lockstep) instead of the default.
export function ScoreGauge({
  percent,
  durationMs = 900,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  onSettled,
}: {
  percent: number;
  durationMs?: number;
  easing?: string;
  onSettled?: () => void;
}) {
  const target = Math.max(0, Math.min(100, percent));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplay(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const angle = -90 + (display / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 68" className="h-20 w-36 overflow-visible">
        <path
          d="M10 62 A50 50 0 0 1 110 62"
          fill="none"
          stroke="var(--overlay-strong)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="60"
          y1="62"
          x2="60"
          y2="22"
          stroke="var(--text-secondary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          onTransitionEnd={(e) => {
            if (e.propertyName === "transform") onSettled?.();
          }}
          style={{
            transformOrigin: "60px 62px",
            transform: `rotate(${angle}deg)`,
            transition: `transform ${durationMs}ms ${easing}`,
          }}
        />
      </svg>
      <p className="text-[19px] font-medium font-serif text-[var(--text-secondary)]">{Math.round(display)}%</p>
    </div>
  );
}

// Shared end-of-session panel for all quiz modes: score is the headline.
// >=80% is green, >=50% is yellow, below is red — flat colors, no
// animation, except a perfect score, which gets the flowing green ring/text
// (running from the very first frame) plus faint outward pulses. The whole
// panel focuses in (blur -> sharp, faded -> opaque) on open regardless of
// tier.
export function SessionCompletePanel({
  sourceLabel,
  passed,
  total,
  onExit,
}: {
  sourceLabel: string;
  passed: number;
  total: number;
  onExit: () => void;
}) {
  const ratio = total > 0 ? passed / total : 0;
  const isPerfect = passed === total;
  const tier: "green" | "yellow" | "red" = ratio >= 0.8 ? "green" : ratio >= 0.5 ? "yellow" : "red";
  const tierColorVar = tier === "green" ? "--score-correct" : tier === "yellow" ? "--score-mostly" : "--score-false";
  const scoreTextClass = "text-[52px] font-bold font-serif leading-[1.2]";

  return (
    <div
      className={`result-panel-enter relative mx-auto max-w-xl rounded-2xl border border-transparent bg-panel p-6 text-center ${
        isPerfect ? "result-flowing-frame" : `result-tier-frame result-tier-${tier}`
      }`}
    >
      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">{sourceLabel}</p>
      <h2 className="mb-3 text-[13px] font-medium text-muted font-serif">Session complete</h2>
      <p
        className={`mb-8 ${scoreTextClass} ${isPerfect ? "result-flowing-text" : ""}`}
        style={isPerfect ? undefined : { color: `var(${tierColorVar})` }}
      >
        {passed}/{total}
      </p>
      <button
        onClick={onExit}
        className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
      >
        Done
      </button>
    </div>
  );
}
