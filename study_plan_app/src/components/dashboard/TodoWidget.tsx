"use client";

import { useEffect, useState } from "react";
import { Check, ListChecks, Plus } from "lucide-react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

// TODO: durch echte uid aus einem Login/Auth-System ersetzen, sobald es das gibt.
const CURRENT_UID = 26;

export function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");

  // Lädt dieselben Todos wie die eigene /todos-Seite (GET /api/todo/todoGetAll),
  // statt einer lokalen, hart codierten Liste.
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch(`/api/todo/todoGetAll?uid=${CURRENT_UID}`);
        const data = await response.json();
        if (!response.ok) return;
        const list: Todo[] = (data.todos ?? []).map(
          (row: { to_do_id: number; text: string; completed: boolean }) => ({
            id: row.to_do_id,
            text: row.text,
            completed: row.completed,
          })
        );
        setTodos(list);
      } catch {
        // Widget bleibt dann einfach leer - die /todos-Seite zeigt Details/Fehler.
      }
    };

    fetchTodos();
  }, []);

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await fetch("/api/todo/todoEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: CURRENT_UID,
          todoId: todo.id,
          text: todo.text,
          completed: !todo.completed,
        }),
      });
    } catch {
      // TODO: Fehler-Toast, falls relevant.
    }
  };

  const addTodo = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const response = await fetch("/api/todo/todoCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: CURRENT_UID, text }),
      });
      const data = await response.json();
      if (!response.ok) return;
      setTodos((prev) => [
        ...prev,
        { id: data.todo.to_do_id, text: data.todo.text, completed: data.todo.completed },
      ]);
    } catch {
      // TODO: Fehler-Toast, falls relevant.
    }
  };

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
            <ListChecks size={14} />
          </span>
          <h3 className="text-[19px] font-semibold text-foreground font-serif">To-do</h3>
        </div>
        <span className="text-[12px] text-muted">
          {doneCount}/{todos.length} done
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {todos.map((todo) => (
          <button
            key={todo.id}
            onClick={() => toggleTodo(todo)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--overlay)]"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                todo.completed ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)]"
              }`}
            >
              {todo.completed && <Check size={11} strokeWidth={3} className="text-accent-foreground" />}
            </span>
            <span
              className={`text-[14.5px] transition-colors ${
                todo.completed ? "text-muted line-through" : "text-[var(--text-secondary)]"
              }`}
            >
              {todo.text}
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
