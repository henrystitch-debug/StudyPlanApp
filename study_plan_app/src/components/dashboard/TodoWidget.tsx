"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { TodoItem } from "./types";
import { INITIAL_TODOS } from "./constants";

export function TodoWidget() {
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [draft, setDraft] = useState("");

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTodo = () => {
    const label = draft.trim();
    if (!label) return;
    setTodos((prev) => [...prev, { id: `t${Date.now()}`, label, done: false }]);
    setDraft("");
  };

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[19px] font-semibold text-foreground font-serif">To Do</h3>
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
