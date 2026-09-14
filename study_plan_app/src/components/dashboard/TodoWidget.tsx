"use client";

import { useState } from "react";
import { Check, ListChecks, Plus, X } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";

export function TodoWidget() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodos();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    addTodo(draft);
    setDraft("");
  };

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
            <ListChecks size={14} />
          </span>
          <h3 className="text-[19px] font-semibold text-foreground font-serif">To Do</h3>
        </div>
        <span className="text-[12px] text-muted">
          {doneCount}/{todos.length} done
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--overlay)]"
          >
            <button
              onClick={() => toggleTodo(todo.id)}
              className="flex flex-1 items-center gap-2.5 text-left"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  todo.done ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)]"
                }`}
              >
                {todo.done && <Check size={11} strokeWidth={3} className="text-accent-foreground" />}
              </span>
              <span
                className={`text-[14.5px] transition-colors ${
                  todo.done ? "text-muted line-through" : "text-[var(--text-secondary)]"
                }`}
              >
                {todo.label}
              </span>
            </button>
            <button
              onClick={() => removeTodo(todo.id)}
              aria-label="Delete task"
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
          placeholder="Add a task&hellip;"
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[14px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleAdd}
          className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground transition-colors hover:brightness-110"
          aria-label="Add task"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
