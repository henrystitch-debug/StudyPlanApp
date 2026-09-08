"use client";

import { useState } from "react";
import { ChevronRight, Check, X, Plus } from "lucide-react";
import type { CoursePlan } from "./types";
import { INITIAL_COURSE_PLANS } from "./constants";

export function StudyPlanWidget() {
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>(INITIAL_COURSE_PLANS);
  const [openCourseId, setOpenCourseId] = useState<string | null>(
    INITIAL_COURSE_PLANS[0]?.id ?? null
  );
  const [draftTask, setDraftTask] = useState<Record<string, string>>({});

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

  const addItem = (courseId: string) => {
    const task = (draftTask[courseId] ?? "").trim();
    if (!task) return;
    setCoursePlans((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, items: [...c.items, { id: `p${Date.now()}`, task, done: false }] }
          : c
      )
    );
    setDraftTask((prev) => ({ ...prev, [courseId]: "" }));
  };

  const removeItem = (courseId: string, itemId: string) => {
    setCoursePlans((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      )
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[19px] font-semibold text-foreground font-serif">Study Plan</h3>

      <div className="flex flex-1 flex-col gap-2">
        {coursePlans.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
            <p className="text-[14px] leading-5 text-muted">
              No courses yet &ndash; add a subject to start planning.
            </p>
          </div>
        )}

        {coursePlans.map((course) => {
          const open = openCourseId === course.id;
          const doneCount = course.items.filter((i) => i.done).length;

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
                <span className="text-[12px] text-muted">
                  {doneCount}/{course.items.length}
                </span>
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
                />
              </button>

              {open && (
                <div className="flex flex-col gap-1 p-2">
                  {course.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--overlay)]"
                    >
                      <button
                        onClick={() => toggleItem(course.id, item.id)}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.done ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)]"
                        }`}
                        aria-label={item.done ? "Mark as not done" : "Mark as done"}
                      >
                        {item.done && <Check size={11} strokeWidth={3} className="text-accent-foreground" />}
                      </button>
                      <span
                        className={`flex-1 text-[14.5px] transition-colors ${
                          item.done ? "text-muted line-through" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {item.task}
                      </span>
                      <button
                        onClick={() => removeItem(course.id, item.id)}
                        className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                        aria-label="Remove plan item"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}

                  <div className="mt-1 flex items-center gap-2 border-t border-panel-border pt-2">
                    <input
                      value={draftTask[course.id] ?? ""}
                      onChange={(e) =>
                        setDraftTask((prev) => ({ ...prev, [course.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addItem(course.id)}
                      placeholder="Add a task&hellip;"
                      className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[14px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      onClick={() => addItem(course.id)}
                      className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground transition-colors hover:brightness-110"
                      aria-label="Add plan item"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
