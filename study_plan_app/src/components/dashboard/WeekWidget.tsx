"use client";

import { WEEKDAYS } from "./constants";

export function WeekWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-4 text-[19px] font-semibold text-foreground font-serif">This Week</h3>

      <div className="flex flex-1 items-end justify-between gap-2 border-b border-panel-border pb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-2">
            <div className="h-16 w-full rounded-t-sm bg-[var(--overlay)]" />
            <span className="text-[11.5px] text-muted">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between">
        <div>
          <p className="text-[21px] font-medium text-[var(--accent-strong)] font-serif">0h</p>
          <p className="text-[12px] text-muted">Studied This Week</p>
        </div>
        <div className="text-right">
          <p className="text-[21px] font-medium text-[var(--accent-strong)] font-serif">0</p>
          <p className="text-[12px] text-muted">Focus Sessions</p>
        </div>
      </div>
    </div>
  );
}
