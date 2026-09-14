"use client";

import { useState } from "react";
import { Check, Circle, CircleCheckBig, ListChecks, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function TodoPage() {
  const { todos, addTodo, toggleTodo, removeTodo, clearCompleted } = useTodos();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    addTodo(draft);
    setDraft("");
  };

  const active = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);
  const total = todos.length;
  const percent = total === 0 ? 0 : Math.round((completed.length / total) * 100);
  const ringOffset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;

  return (
    <>
      <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        To Do
      </h1>

      <div className="hover-glow relative mb-8 overflow-hidden rounded-2xl border border-panel-border bg-[linear-gradient(to_bottom_right,var(--hero-from),var(--hero-to))] p-8 text-center shadow-hero">
        <div className="relative mx-auto flex h-[132px] w-[132px] items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-[132px] w-[132px] -rotate-90">
            <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="var(--overlay-strong)" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[30px] font-medium leading-none text-[var(--accent-strong)] font-serif">
              {completed.length}/{total}
            </span>
            <span className="mt-1.5 text-[10.5px] uppercase tracking-wider text-muted">Done</span>
          </div>
        </div>

        {total === 0 ? (
          <p className="mx-auto mt-4 max-w-xs text-[12.5px] leading-5 text-muted">
            Add your first task below to get started.
          </p>
        ) : percent === 100 ? (
          <p className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-1.5 text-[12.5px] leading-5 text-[var(--accent-strong)]">
            <Sparkles size={13} />
            Everything&rsquo;s done &ndash; nice work.
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-xs text-[12.5px] leading-5 text-muted">
            {active.length} task{active.length === 1 ? "" : "s"} left. Keep going.
          </p>
        )}
      </div>

      <div className="hover-glow mb-6 flex items-center gap-2.5 rounded-2xl border border-panel-border bg-panel p-3 shadow-sm">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What do you need to get done?"
          className="min-w-0 flex-1 rounded-xl border border-panel-border bg-[var(--sunken)] px-4 py-2.5 text-[15px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-colors hover:brightness-110"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-16 text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ListChecks size={20} />
          </span>
          <p className="text-[14.5px] text-[var(--text-secondary)]">Nothing on your list yet.</p>
          <p className="mt-1 text-[12.5px] text-muted">Add a task above to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 && (
            <section className="hover-glow rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wider text-muted">
                <Circle size={12} />
                Active
              </h2>
              <div className="flex flex-col gap-1">
                {active.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    label={todo.label}
                    done={false}
                    onToggle={() => toggleTodo(todo.id)}
                    onRemove={() => removeTodo(todo.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="hover-glow rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wider text-muted">
                  <CircleCheckBig size={12} />
                  Completed
                </h2>
                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] text-muted transition-colors hover:bg-[var(--overlay)] hover:text-rose"
                >
                  <Trash2 size={12} />
                  Clear completed
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {completed.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    label={todo.label}
                    done
                    onToggle={() => toggleTodo(todo.id)}
                    onRemove={() => removeTodo(todo.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function TodoRow({
  label,
  done,
  onToggle,
  onRemove,
}: {
  label: string;
  done: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[var(--overlay)]">
      <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
            done ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)] hover:border-accent"
          }`}
        >
          {done && <Check size={12} strokeWidth={3} className="text-accent-foreground" />}
        </span>
        <span
          className={`text-[15px] transition-colors ${
            done ? "text-muted line-through" : "text-[var(--text-secondary)]"
          }`}
        >
          {label}
        </span>
      </button>
      <button
        onClick={onRemove}
        aria-label="Delete task"
        className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
