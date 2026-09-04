"use client";

import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import type { CoursePlan } from "./types";
import { INITIAL_COURSE_PLANS } from "./constants";

export function AnalyticsWidget() {
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>(INITIAL_COURSE_PLANS);
  const [openCourseId, setOpenCourseId] = useState<string | null>(
    INITIAL_COURSE_PLANS[0]?.id ?? null
  );

  const toggleCourse = (id: string) => {
    setOpenCourseId((prev) => (prev === id ? null : id));
  };

  const toggleItem = (courseId: string, itemId: string) => {
    setCoursePlans((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : c
      )
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[19px] font-semibold text-foreground font-serif">Analytics</h3>

      <div className="flex flex-1 flex-col gap-2">
        {coursePlans.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
            <p className="text-[14px] leading-5 text-muted">
              No courses yet &ndash; add a subject to see progress.
            </p>
          </div>
        )}

        {coursePlans.map((course) => {
          const open = openCourseId === course.id;
          const doneCount = course.items.filter((i) => i.done).length;
          const total = course.items.length;
          const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

          return (
            <div key={course.id} className="overflow-hidden rounded-xl border border-panel-border">
              <button
                onClick={() => toggleCourse(course.id)}
                className="flex w-full items-center gap-2.5 bg-[var(--sunken)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--overlay)]"
              >
                <span className={`h-2 w-2 shrink-0 rounded-sm ${course.color}`} />
                <span className="flex-1 text-[14.5px] text-[var(--text-secondary)]">
                  {course.course}
                </span>
                <span className="text-[12px] text-muted">{percent}%</span>
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
                />
              </button>

              <div className="h-1 w-full bg-[var(--sunken)]">
                <div className="h-1 bg-accent transition-all" style={{ width: `${percent}%` }} />
              </div>

              {open && (
                <div className="flex flex-col gap-1 p-2">
                  {course.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(course.id, item.id)}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--overlay)]"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.done ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)]"
                        }`}
                      >
                        {item.done && <Check size={11} strokeWidth={3} className="text-accent-foreground" />}
                      </span>
                      <span
                        className={`text-[14.5px] transition-colors ${
                          item.done ? "text-muted line-through" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {item.task}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
