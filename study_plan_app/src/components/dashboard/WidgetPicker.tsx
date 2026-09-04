"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { WIDGET_REGISTRY } from "./WidgetRegistry";

type WidgetPickerProps = {
  activeIds: string[];
  onToggle: (id: string) => void;
};

export function WidgetPicker({ activeIds, onToggle }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-panel-border bg-[var(--overlay)] px-3 py-1.5 text-[13.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
      >
        <SlidersHorizontal size={13} />
        Customize
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-panel-border bg-[var(--sidebar)] p-3 shadow-2xl">
          <p className="mb-2 px-1 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Dashboard widgets
          </p>
          <div className="flex flex-col gap-0.5">
            {WIDGET_REGISTRY.map((widget) => {
              const active = activeIds.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => onToggle(widget.id)}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--overlay)]"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      active ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)]"
                    }`}
                  >
                    {active && <Check size={11} strokeWidth={3} className="text-accent-foreground" />}
                  </span>
                  <span>
                    <span className="block text-[14px] text-[var(--text-secondary)]">
                      {widget.label}
                    </span>
                    <span className="block text-[12.5px] leading-snug text-muted">
                      {widget.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
