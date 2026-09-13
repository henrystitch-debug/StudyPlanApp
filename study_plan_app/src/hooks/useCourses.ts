"use client";

import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// The user's courses — one shared list, read by the Courses page, the calendar
// filter, and anything else that needs "what is this student taking".
//
// There is no course backend yet, so the list lives in localStorage (+ a
// `storage` event so other tabs stay in sync), mirroring how useAuth works.
// Swap the body of `read()` for `GET /api/course/coursesAll` once it exists;
// the rest of the app talks to this hook, not to storage.
// ---------------------------------------------------------------------------

export type Course = {
  id: string;
  name: string;
  /** tailwind dot/badge class, e.g. "bg-sky-400" */
  color: string;
};

const STORAGE_KEY = "study-plan-courses";

const COURSE_COLORS = [
  "bg-sky-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-rose-400",
  "bg-amber-400",
  "bg-fuchsia-400",
  "bg-teal-400",
  "bg-indigo-400",
];

const DEFAULT_COURSES: Course[] = [
  { id: "maths", name: "Maths", color: "bg-sky-400" },
  { id: "science", name: "Science", color: "bg-emerald-400" },
  { id: "english", name: "English", color: "bg-violet-400" },
  { id: "art", name: "Art", color: "bg-rose-400" },
  { id: "history", name: "History", color: "bg-amber-400" },
];

const listeners = new Set<() => void>();
let cache: Course[] | undefined;

function read(): Course[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((c) => c && typeof c.id === "string")) {
        return parsed as Course[];
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_COURSES;
}

function write(next: Course[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Add a course by name. Returns the course (existing one if the name collides). */
export function addCourse(name: string): Course | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const current = cache ?? read();
  const id = slugify(trimmed) || `course-${Date.now()}`;
  const existing = current.find((c) => c.id === id);
  if (existing) return existing;
  const course: Course = {
    id,
    name: trimmed,
    color: COURSE_COLORS[current.length % COURSE_COLORS.length],
  };
  write([...current, course]);
  return course;
}

export function removeCourse(id: string) {
  const current = cache ?? read();
  write(current.filter((c) => c.id !== id));
}

function handleStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  cache = read();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): Course[] {
  if (cache === undefined) cache = read();
  return cache;
}

// Server (and first client render) see the defaults; the client corrects after
// mount if localStorage differs. useSyncExternalStore handles that safely.
function getServerSnapshot(): Course[] {
  return DEFAULT_COURSES;
}

export function useCourses() {
  const courses = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    courses,
    addCourse: useCallback((name: string) => addCourse(name), []),
    removeCourse: useCallback((id: string) => removeCourse(id), []),
  };
}
