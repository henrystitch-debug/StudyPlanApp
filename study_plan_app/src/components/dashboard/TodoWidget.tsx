"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type TodoItem = {
  id: number;
  label: string;
  done: boolean;
};

type RawTodo = {
  to_do_id: number;
  text: string;
  completed: boolean;
};

export function TodoWidget() {
  const { userId } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchTodos() {
      try {
        // TODO: confirm this matches your real route path/response shape
        const url = new URL("/api/todo/todosGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();
      
        const rawTodos: RawTodo[] = data.todos ?? data;
        setTodos(
          rawTodos.map((t) => ({
            id: t.to_do_id,
            label: t.text,
            done: t.completed,
          }))
        );
      } catch (err) {
        console.error("Failed to load todos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTodos();
  }, [userId]);

  const toggleTodo = async (id: number) => {
  const target = todos.find((t) => t.id === id);
  if (!target || !userId) return;
  const nextDone = !target.done;

  setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)));

  try {
    const todoId = id;
    const res = await fetch(`/api/todo/todoUpdate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoId, userId, text: target.label, completed: nextDone }),
    });
    if (!res.ok) throw new Error("Update failed");
  } catch (err) {
    console.error(err);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t)));
  }
};

  const addTodo = async () => {
    const label = draft.trim();
    if (!label || !userId) return;
    setDraft("");

    try {
      const res = await fetch("/api/todo/todoCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: label }),
      });
      if (!res.ok) throw new Error("Create failed");
      const data = await res.json();
      const newTodo: TodoItem = {
        id: data.todo.to_do_id,
        label: data.todo.text,
        done: data.todo.completed,
      };
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      console.error(err);
      setDraft(label); // restore the input so the user doesn't lose what they typed
    }
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
        {loading ? (
          <p className="text-[13px] text-muted">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-[13px] text-muted">No tasks yet.</p>
        ) : (
          todos.map((todo) => (
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
          ))
        )}
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