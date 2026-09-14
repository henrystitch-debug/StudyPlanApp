"use client";

import { useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";

export function CoursesWidget() {
  const { courses, addCourse, removeCourse } = useCourses();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    if (addCourse(draft)) setDraft("");
  };

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose/15 text-rose">
            <BookOpen size={14} />
          </span>
          <h3 className="text-[19px] font-semibold text-foreground font-serif">Your Courses</h3>
        </div>
        <span className="text-[12px] text-muted">{courses.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {courses.length === 0 && (
          <p className="flex flex-1 items-center justify-center text-center text-[13px] text-muted">
            No courses yet &ndash; add one below.
          </p>
        )}
        {courses.map((course) => (
          <div
            key={course.id}
            className="group flex items-center gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-[var(--overlay)]"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${course.color}`} />
            <p className="min-w-0 flex-1 truncate text-[14.5px] text-[var(--text-secondary)]">
              {course.name}
            </p>
            <button
              onClick={() => removeCourse(course.id)}
              aria-label={`Remove ${course.name}`}
              className="shrink-0 rounded-md p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-panel-border pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a course&hellip;"
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[14px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleAdd}
          className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground transition-colors hover:brightness-110"
          aria-label="Add course"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
