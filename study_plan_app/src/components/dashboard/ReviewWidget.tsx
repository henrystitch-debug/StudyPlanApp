"use client";

import { RotateCcw, Layers } from "lucide-react";

export function ReviewWidget() {
  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose/15 text-rose">
          <RotateCcw size={14} />
        </span>
        <h3 className="text-[19px] font-semibold text-foreground font-serif">Due for Review</h3>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
        <Layers size={20} className="text-muted" />
        <p className="text-[14px] leading-5 text-muted">
          No flashcards yet &ndash; generate some from a document.
        </p>
      </div>
    </div>
  );
}
