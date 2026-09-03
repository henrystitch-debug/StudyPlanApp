"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Sun,
  Moon,
  BookOpen,
  Flame,
  BarChart2,
  Plus,
  Menu,
  X,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  Check,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

type Theme = "dark" | "light";
const THEME_STORAGE_KEY = "study-learn-theme";

// Injects the bubbly Google Font pairing used across the app.
// Baloo 2 for headings (font-serif), Quicksand for body copy (font-sans).
function useBubblyFonts() {
  useEffect(() => {
    if (document.getElementById("bubbly-font-link")) return;
    const link = document.createElement("link");
    link.id = "bubbly-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Quicksand:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | Theme
      | null;
    const preferred: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Today", icon: Sun, active: true },
  { label: "Flashcards", icon: BookOpen },
  { label: "Streak", icon: Flame },
  { label: "Calendar", icon: CalendarDays },
  { label: "Study Plan", icon: ClipboardList },
  { label: "Analytics", icon: BarChart2 },
];

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-[var(--scrim)] backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-panel-border bg-[var(--sidebar)] px-4 py-5 transition-transform duration-300 ease-out md:static md:z-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-300 to-accent" />
            <span className="text-[18px] font-medium tracking-tight text-foreground font-serif">
              Study Learn App
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-[var(--overlay)] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14.5px] transition-colors ${
                active
                  ? "bg-[var(--overlay-strong)] text-foreground"
                  : "text-muted hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-accent" : "bg-transparent"
                }`}
              />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-7 px-3">
          <p className="mb-2 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Subjects
          </p>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[14.5px] text-[var(--text-secondary)] hover:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              art
            </button>
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[14.5px] text-muted hover:text-[var(--text-secondary)]">
              <Plus size={13} />
              New subject
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-panel-border px-1 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500" />
            <span className="text-[14px] text-[var(--text-secondary)]">
              Manar Khayi
            </span>
          </div>
          <button className="text-[13px] text-muted hover:text-[var(--text-secondary)]">
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

function FocusCard() {
  const DURATION = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleSkip = () => {
    setRunning(false);
    setSecondsLeft(DURATION);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-panel-border bg-[linear-gradient(to_bottom_right,var(--hero-from),var(--hero-to))] p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Focus Session
          </div>
          <h2 className="mb-3 text-[23px] font-medium leading-[1.35] text-foreground font-serif sm:text-[27px]">
            Pull your desk lamp closer. 25 minutes, only art, nothing else.
          </h2>
          <p className="mb-4 text-[14.5px] leading-6 text-muted">
            The timer dims the rest of your workspace while it runs
            &ndash; lit up is only what you&apos;re actually working on.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[13px] text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-sm bg-rose" />
            art
            <ChevronRight size={12} className="rotate-90 text-muted" />
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl border border-panel-border bg-[var(--sunken)] px-8 py-6 sm:px-10">
          <span className="text-[44px] font-light tabular-nums tracking-tight text-[var(--accent-strong)] font-serif sm:text-[48px]">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Focus Round 1
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground transition-colors hover:brightness-110"
            >
              {running ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={handleSkip}
              className="rounded-full border border-panel-border bg-[var(--overlay)] px-4 py-2 text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectsWidget() {
  return (
    <div className="col-span-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[17px] font-medium text-foreground font-serif">
          Your Subjects
        </h3>
        <button className="flex items-center gap-1 text-[13.5px] text-muted hover:text-[var(--text-secondary)]">
          All Subjects <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div className="overflow-hidden rounded-xl border border-panel-border bg-panel transition-colors hover:border-[var(--overlay-strong)]">
          <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
          <div className="p-3">
            <p className="text-[14.5px] text-foreground">art</p>
            <p className="mt-0.5 text-[12px] text-muted">
              0 documents &middot; edited Aug 27, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type TodoItem = {
  id: string;
  label: string;
  done: boolean;
};

const INITIAL_TODOS: TodoItem[] = [
  { id: "t1", label: "Review color theory notes", done: true },
  { id: "t2", label: "Sketch 3 thumbnail studies", done: false },
  { id: "t3", label: "Read chapter on composition", done: false },
];

function TodoWidget() {
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [draft, setDraft] = useState("");

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTodo = () => {
    const label = draft.trim();
    if (!label) return;
    setTodos((prev) => [
      ...prev,
      { id: `t${Date.now()}`, label, done: false },
    ]);
    setDraft("");
  };

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-medium text-foreground font-serif">
          To Do
        </h3>
        <span className="text-[12px] text-muted">
          {doneCount}/{todos.length} done
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {todos.map((todo) => (
          <button
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--overlay)]"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                todo.done
                  ? "border-accent bg-accent"
                  : "border-panel-border bg-[var(--sunken)]"
              }`}
            >
              {todo.done && (
                <Check
                  size={11}
                  strokeWidth={3}
                  className="text-accent-foreground"
                />
              )}
            </span>
            <span
              className={`text-[14.5px] transition-colors ${
                todo.done ? "text-muted line-through" : "text-[var(--text-secondary)]"
              }`}
            >
              {todo.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-panel-border pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task&hellip;"
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[14px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={addTodo}
          className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground transition-colors hover:brightness-110"
          aria-label="Add task"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

type PlanItem = {
  id: string;
  task: string;
  done: boolean;
};

type CoursePlan = {
  id: string;
  course: string;
  color: string; // tailwind bg class, matches Subjects widget style
  items: PlanItem[];
};

const INITIAL_COURSE_PLANS: CoursePlan[] = [
  {
    id: "c1",
    course: "art",
    color: "bg-rose",
    items: [
      { id: "p1", task: "Color theory basics", done: true },
      { id: "p2", task: "Portfolio review", done: false },
      { id: "p3", task: "Life drawing practice", done: false },
    ],
  },
];

function StudyPlanWidget() {
  const [coursePlans, setCoursePlans] =
    useState<CoursePlan[]>(INITIAL_COURSE_PLANS);
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
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, done: !i.done } : i
              ),
            }
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
          ? {
              ...c,
              items: [...c.items, { id: `p${Date.now()}`, task, done: false }],
            }
          : c
      )
    );
    setDraftTask((prev) => ({ ...prev, [courseId]: "" }));
  };

  const removeItem = (courseId: string, itemId: string) => {
    setCoursePlans((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      )
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[16px] font-medium text-foreground font-serif">
        Study Plan
      </h3>

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
            <div
              key={course.id}
              className="overflow-hidden rounded-xl border border-panel-border"
            >
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
                  className={`shrink-0 text-muted transition-transform ${
                    open ? "rotate-90" : ""
                  }`}
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
                          item.done
                            ? "border-accent bg-accent"
                            : "border-panel-border bg-[var(--sunken)]"
                        }`}
                        aria-label={item.done ? "Mark as not done" : "Mark as done"}
                      >
                        {item.done && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-accent-foreground"
                          />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-[14.5px] transition-colors ${
                          item.done
                            ? "text-muted line-through"
                            : "text-[var(--text-secondary)]"
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
                        setDraftTask((prev) => ({
                          ...prev,
                          [course.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && addItem(course.id)
                      }
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

function AnalyticsWidget() {
  const [coursePlans, setCoursePlans] =
    useState<CoursePlan[]>(INITIAL_COURSE_PLANS);
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
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, done: !i.done } : i
              ),
            }
          : c
      )
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[16px] font-medium text-foreground font-serif">
        Analytics
      </h3>

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
            <div
              key={course.id}
              className="overflow-hidden rounded-xl border border-panel-border"
            >
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
                  className={`shrink-0 text-muted transition-transform ${
                    open ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div className="h-1 w-full bg-[var(--sunken)]">
                <div
                  className="h-1 bg-accent transition-all"
                  style={{ width: `${percent}%` }}
                />
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
                          item.done
                            ? "border-accent bg-accent"
                            : "border-panel-border bg-[var(--sunken)]"
                        }`}
                      >
                        {item.done && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-accent-foreground"
                          />
                        )}
                      </span>
                      <span
                        className={`text-[14.5px] transition-colors ${
                          item.done
                            ? "text-muted line-through"
                            : "text-[var(--text-secondary)]"
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

function ReviewWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[16px] font-medium text-foreground font-serif">
        Due for Review
      </h3>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
        <p className="text-[14px] leading-5 text-muted">
          No flashcards yet &ndash; generate some from a document.
        </p>
      </div>
    </div>
  );
}

function WeekWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-4 text-[16px] font-medium text-foreground font-serif">
        This Week
      </h3>

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
          <p className="text-[21px] font-medium text-[var(--accent-strong)] font-serif">
            0h
          </p>
          <p className="text-[12px] text-muted">Studied This Week</p>
        </div>
        <div className="text-right">
          <p className="text-[21px] font-medium text-[var(--accent-strong)] font-serif">
            0
          </p>
          <p className="text-[12px] text-muted">Focus Sessions</p>
        </div>
      </div>
    </div>
  );
}

type WidgetDef = {
  id: string;
  label: string;
  description: string;
  span: "full" | "grid";
  render: () => ReactNode;
};

const WIDGET_REGISTRY: WidgetDef[] = [
  {
    id: "focus",
    label: "Focus Session",
    description: "A 25-minute pomodoro timer for deep work.",
    span: "full",
    render: () => <FocusCard />,
  },
  {
    id: "subjects",
    label: "Your Subjects",
    description: "Grid of the subjects you're studying.",
    span: "full",
    render: () => <SubjectsWidget />,
  },
  {
    id: "todo",
    label: "To Do",
    description: "A quick checklist for today.",
    span: "grid",
    render: () => <TodoWidget />,
  },
  {
    id: "studyplan",
    label: "Study Plan",
    description: "Your courses, open to check off tasks.",
    span: "grid",
    render: () => <StudyPlanWidget />,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Per-course progress, open to check off items.",
    span: "grid",
    render: () => <AnalyticsWidget />,
  },
  {
    id: "review",
    label: "Due for Review",
    description: "Flashcards that need another pass.",
    span: "grid",
    render: () => <ReviewWidget />,
  },
  {
    id: "week",
    label: "This Week",
    description: "Hours studied and focus sessions logged.",
    span: "grid",
    render: () => <WeekWidget />,
  },
];

const DEFAULT_WIDGET_IDS = ["focus", "subjects", "todo", "review", "week", "analytics"];

function WidgetPicker({
  activeIds,
  onToggle,
}: {
  activeIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
                      active
                        ? "border-accent bg-accent"
                        : "border-panel-border bg-[var(--sunken)]"
                    }`}
                  >
                    {active && (
                      <Check
                        size={11}
                        strokeWidth={3}
                        className="text-accent-foreground"
                      />
                    )}
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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] =
    useState<string[]>(DEFAULT_WIDGET_IDS);
  const { theme, toggleTheme } = useTheme();
  useBubblyFonts();

  const toggleWidget = (id: string) => {
    setActiveWidgetIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const activeWidgets = WIDGET_REGISTRY.filter((w) =>
    activeWidgetIds.includes(w.id)
  );

  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
      <style jsx global>{`
        .font-sans {
          font-family: "Quicksand", ui-sans-serif, system-ui, sans-serif;
        }
        .font-serif {
          font-family: "Baloo 2", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-[13.5px] capitalize text-muted">{today}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[13px] font-medium text-rose">
              <Flame size={13} />0 Day Streak
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[27px] font-medium tracking-tight text-foreground font-serif sm:text-[31px]">
              Good evening, <span className="text-[var(--accent-strong)]">Manar</span>.
            </h1>
            <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
          </div>

          {activeWidgets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {activeWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={widget.span === "full" ? "col-span-full" : ""}
                >
                  {widget.render()}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-12 text-center">
              <p className="text-[14.5px] text-muted">
                Your dashboard is empty &ndash; use Customize to add what
                matters to you.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}