"use client";

import { ChevronRight } from "lucide-react";

export function SubjectsWidget() {
  return (
    <div className="col-span-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold text-foreground font-serif">Your Subjects</h3>
        <button className="flex items-center gap-1 text-[13.5px] text-muted hover:text-[var(--text-secondary)]">
          All Subjects <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div className="overflow-hidden rounded-xl border border-panel-border bg-panel transition-colors hover:border-[var(--overlay-strong)]">
          <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
          <div className="p-3">
            <p className="text-[14.5px] text-foreground">art</p>
            <p className="mt-0.5 text-[12px] text-muted">0 documents &middot; edited Aug 27, 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
