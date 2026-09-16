"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ModeDef, MIN_QUESTIONS, MAX_QUESTIONS } from "./quizCore";
import { ModeIllustration } from "./ModeIllustrations";

export function ModeCard({
  mode,
  selected,
  onSelect,
  onHover,
}: {
  mode: ModeDef;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = mode.icon;
  const [hoverKey, setHoverKey] = useState(0);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => {
        setHoverKey((k) => k + 1);
        onHover();
      }}
      className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border px-5 py-6 text-left transition-colors ${
        selected ? "border-accent bg-[var(--overlay-strong)]" : "border-panel-border bg-panel hover:bg-[var(--overlay)]"
      }`}
    >
      <div className="flex flex-col items-start gap-2 transition-opacity duration-150 group-hover:opacity-0">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            selected ? "bg-accent text-accent-foreground" : "bg-[var(--sunken)] text-muted"
          }`}
        >
          <Icon size={16} />
        </span>
        <span style={selected ? { viewTransitionName: "mode-title" } : undefined} className="text-[15px] font-medium text-foreground font-serif">
          {mode.label}
        </span>
        <span className="text-[12.5px] leading-snug text-muted">{mode.description}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-between px-5 py-6 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <ModeIllustration key={hoverKey} mode={mode.id} />
        <span className="text-[15px] font-medium text-foreground font-serif">{mode.label}</span>
      </div>
    </button>
  );
}

export function CountStep({
  modeLabel,
  count,
  onCountChange,
  onBack,
  onContinue,
  min = MIN_QUESTIONS,
  max = MAX_QUESTIONS,
}: {
  modeLabel: string;
  count: number;
  onCountChange: (n: number) => void;
  onBack: () => void;
  onContinue: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="step-enter mx-auto max-w-xl">
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12.5px] text-muted hover:text-[var(--text-secondary)]">
        <ArrowLeft size={14} />
        Change learning type
      </button>

      <h2 style={{ viewTransitionName: "mode-title" }} className="mb-6 text-[19px] font-medium text-accent font-serif">
        {modeLabel}
      </h2>

      <div className="mb-4 flex items-baseline justify-center gap-1.5">
        <span className="text-[40px] font-bold font-serif leading-none text-foreground">{count}</span>
        <span className="text-[13px] text-muted">questions</span>
      </div>
      <input
        type="range"
        autoFocus
        min={min}
        max={max}
        step={1}
        value={count}
        onChange={(e) => onCountChange(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onContinue();
          }
        }}
        className="w-full accent-accent"
      />

      <button
        onClick={onContinue}
        className="mt-6 w-full rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
      >
        Continue
      </button>
    </div>
  );
}
