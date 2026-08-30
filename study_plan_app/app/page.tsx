"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Sun,
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
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-panel-border bg-[#0c0f1d] px-4 py-5 transition-transform duration-300 ease-out md:static md:z-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-300 to-accent" />
            <span className="text-[17px] font-medium tracking-tight text-foreground font-serif">
              Study Learn App
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-white/5 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${
                active
                  ? "bg-white/[0.07] text-foreground"
                  : "text-muted hover:bg-white/[0.04] hover:text-slate-200"
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
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-wider text-muted">
            Subjects
          </p>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-slate-200 hover:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              art
            </button>
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-muted hover:text-slate-300">
              <Plus size={13} />
              New subject
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-panel-border px-1 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500" />
            <span className="text-[13px] text-slate-300">Manar Khayi</span>
          </div>
          <button className="text-[12px] text-muted hover:text-slate-300">
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
    <div className="relative overflow-hidden rounded-2xl border border-panel-border bg-gradient-to-br from-[#151a34] to-[#1a1030] p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Focus Session
          </div>
          <h2 className="mb-3 text-[22px] font-medium leading-[1.35] text-foreground font-serif sm:text-[26px]">
            Pull your desk lamp closer. 25 minutes, only art, nothing else.
          </h2>
          <p className="mb-4 text-[13.5px] leading-6 text-muted">
            The timer dims the rest of your workspace while it runs
            &ndash; lit up is only what you&apos;re actually working on.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-white/[0.04] px-2.5 py-1 text-[12px] text-slate-200">
            <span className="h-2 w-2 rounded-sm bg-rose" />
            art
            <ChevronRight size={12} className="rotate-90 text-muted" />
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl border border-panel-border bg-black/20 px-8 py-6 sm:px-10">
          <span className="text-[42px] font-light tabular-nums tracking-tight text-amber-200 font-serif sm:text-[46px]">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted">
            Focus Round 1
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-accent-foreground transition-colors hover:brightness-110"
            >
              {running ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={handleSkip}
              className="rounded-full border border-panel-border bg-white/[0.04] px-4 py-2 text-[13px] text-slate-300 transition-colors hover:bg-white/[0.08]"
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
        <h3 className="text-[16px] font-medium text-foreground font-serif">
          Your Subjects
        </h3>
        <button className="flex items-center gap-1 text-[12.5px] text-muted hover:text-slate-200">
          All Subjects <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div className="overflow-hidden rounded-xl border border-panel-border bg-panel transition-colors hover:border-white/[0.14]">
          <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
          <div className="p-3">
            <p className="text-[13.5px] text-foreground">art</p>
            <p className="mt-0.5 text-[11px] text-muted">
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
        <h3 className="text-[15px] font-medium text-foreground font-serif">
          To Do
        </h3>
        <span className="text-[11px] text-muted">
          {doneCount}/{todos.length} done
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {todos.map((todo) => (
          <button
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                todo.done
                  ? "border-accent bg-accent"
                  : "border-panel-border bg-black/20"
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
              className={`text-[13.5px] transition-colors ${
                todo.done ? "text-muted line-through" : "text-slate-200"
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
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-black/20 px-2.5 py-1.5 text-[13px] text-slate-200 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
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
  day: string;
  task: string;
};

const INITIAL_PLAN: PlanItem[] = [
  { id: "p1", day: "Mon", task: "Color theory basics" },
  { id: "p2", day: "Wed", task: "Portfolio review" },
  { id: "p3", day: "Fri", task: "Life drawing practice" },
];

function StudyPlanWidget() {
  const [plan, setPlan] = useState<PlanItem[]>(INITIAL_PLAN);
  const [day, setDay] = useState("");
  const [task, setTask] = useState("");

  const addItem = () => {
    const d = day.trim();
    const t = task.trim();
    if (!d || !t) return;
    setPlan((prev) => [...prev, { id: `p${Date.now()}`, day: d, task: t }]);
    setDay("");
    setTask("");
  };

  const removeItem = (id: string) => {
    setPlan((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[15px] font-medium text-foreground font-serif">
        Study Plan
      </h3>

      <div className="flex flex-1 flex-col gap-1.5">
        {plan.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-black/10 px-4 py-8 text-center">
            <p className="text-[13px] leading-5 text-muted">
              No plan items yet &ndash; add what you want to study, and when.
            </p>
          </div>
        )}
        {plan.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.04]"
          >
            <span className="shrink-0 rounded-md border border-panel-border bg-black/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-accent">
              {item.day}
            </span>
            <span className="flex-1 text-[13.5px] text-slate-200">
              {item.task}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
              aria-label="Remove plan item"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-panel-border pt-3">
        <input
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="Day"
          className="w-16 shrink-0 rounded-md border border-panel-border bg-black/20 px-2 py-1.5 text-[13px] text-slate-200 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="What are you studying?"
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-black/20 px-2.5 py-1.5 text-[13px] text-slate-200 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={addItem}
          className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground transition-colors hover:brightness-110"
          aria-label="Add plan item"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function ReviewWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[15px] font-medium text-foreground font-serif">
        Due for Review
      </h3>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-black/10 px-4 py-8 text-center">
        <p className="text-[13px] leading-5 text-muted">
          No flashcards yet &ndash; generate some from a document.
        </p>
      </div>
    </div>
  );
}

function WeekWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-4 text-[15px] font-medium text-foreground font-serif">
        This Week
      </h3>

      <div className="flex flex-1 items-end justify-between gap-2 border-b border-panel-border pb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-2">
            <div className="h-16 w-full rounded-t-sm bg-white/[0.05]" />
            <span className="text-[10.5px] text-muted">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between">
        <div>
          <p className="text-[20px] font-medium text-amber-200 font-serif">
            0h
          </p>
          <p className="text-[11px] text-muted">Studied This Week</p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-medium text-amber-200 font-serif">
            0
          </p>
          <p className="text-[11px] text-muted">Focus Sessions</p>
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
    description: "What you're studying, and on which day.",
    span: "grid",
    render: () => <StudyPlanWidget />,
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

const DEFAULT_WIDGET_IDS = ["subjects", "todo", "review", "week"];

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
        className="flex items-center gap-1.5 rounded-full border border-panel-border bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-slate-200 transition-colors hover:bg-white/[0.08]"
      >
        <SlidersHorizontal size={13} />
        Customize
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-panel-border bg-[#0c0f1d] p-3 shadow-2xl">
          <p className="mb-2 px-1 text-[10.5px] font-medium uppercase tracking-wider text-muted">
            Dashboard widgets
          </p>
          <div className="flex flex-col gap-0.5">
            {WIDGET_REGISTRY.map((widget) => {
              const active = activeIds.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => onToggle(widget.id)}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      active
                        ? "border-accent bg-accent"
                        : "border-panel-border bg-black/20"
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
                    <span className="block text-[13px] text-slate-200">
                      {widget.label}
                    </span>
                    <span className="block text-[11.5px] leading-snug text-muted">
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
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-white/5 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-[12.5px] capitalize text-muted">{today}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[12px] font-medium text-rose">
            <Flame size={13} />0 Day Streak
          </span>
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
              Good evening, <span className="text-amber-200">Manar</span>.
            </h1>
            <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
          </div>

          <FocusCard />

          {activeWidgets.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-black/10 px-4 py-12 text-center">
              <p className="text-[13.5px] text-muted">
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
