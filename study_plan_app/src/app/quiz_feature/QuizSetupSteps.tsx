"use client";
import { useState } from "react";
import { ModeDef } from "./quizCore";
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
