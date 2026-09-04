"use client";

import { WEEKDAYS } from "./constants";

export function WeekWidget() {
  return (
    <div className="rounded-2xl border border-panel-border bg-[var(--sunken)] p-4">
      <h3 className="mb-2 text-[15px] font-medium text-foreground">This Week</h3>
      <div className="flex justify-between">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-[13.5px] text-muted">
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}