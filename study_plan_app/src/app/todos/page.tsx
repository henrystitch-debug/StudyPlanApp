"use client";
import { useEffect, useState } from "react";
import { Check, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

// TODO: durch echte uid aus einem Login/Auth-System ersetzen, sobald es das gibt.
const CURRENT_UID = 26;

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/todo/todoGetAll?uid=${CURRENT_UID}`);
        const data = await response.json();

        if (response.status === 404) {
          setTodos([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "To-dos konnten nicht geladen werden");
        }

        const list: Todo[] = (data.todos ?? []).map(
          (row: { to_do_id: number; text: string; completed: boolean }) => ({
            id: row.to_do_id,
            text: row.text,
            completed: row.completed,
          })
        );
        setTodos(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;

    setIsAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: CURRENT_UID, text }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "To-do konnte nicht angelegt werden");
      }

      setTodos((prev) => [
        ...prev,
        { id: data.todo.to_do_id, text: data.todo.text, completed: data.todo.completed },
      ]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: CURRENT_UID,
          todoId: todo.id,
          text: todo.text,
          completed: !todo.completed,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "To-do konnte nicht aktualisiert werden");
      }

      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: data.todo.completed } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (todo: Todo) => {
    const text = editText.trim();
    if (!text) return;

    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: CURRENT_UID,
          todoId: todo.id,
          text,
          completed: todo.completed,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "To-do konnte nicht aktualisiert werden");
      }

      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, text: data.todo.text } : t))
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (todo: Todo) => {
    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/todo/todoDelete?uid=${CURRENT_UID}&todoId=${todo.id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "To-do konnte nicht gelöscht werden");
      }

      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusyId(null);
    }
  };

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
          To-dos
        </h1>
        {todos.length > 0 && (
          <span className="text-[13px] text-muted">
            {doneCount}/{todos.length} done
          </span>
        )}
      </div>

      <div className="mb-5 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-md border border-panel-border bg-panel px-3 py-2 text-[13.5px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !draft.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13.5px] font-medium text-accent-foreground transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add
        </button>
      </div>

      {error && <p className="mb-3 text-[12.5px] text-rose">{error}</p>}

      {isLoading ? (
        <p className="text-[13px] text-muted">Loading…</p>
      ) : todos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
          <p className="text-[13px] text-muted">
            No to-dos yet &ndash; add one above to get started.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-2.5 rounded-lg border border-panel-border bg-panel px-3 py-2.5"
            >
              <button
                onClick={() => handleToggle(todo)}
                disabled={busyId === todo.id}
                aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  todo.completed
                    ? "border-accent bg-accent"
                    : "border-panel-border bg-[var(--sunken)]"
                }`}
              >
                {todo.completed && (
                  <Check size={13} strokeWidth={3} className="text-accent-foreground" />
                )}
              </button>

              {editingId === todo.id ? (
                <>
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(todo);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1 text-[13.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    onClick={() => saveEdit(todo)}
                    disabled={busyId === todo.id || !editText.trim()}
                    className="shrink-0 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="shrink-0 rounded-md px-2 py-1 text-[12px] text-muted hover:text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`flex-1 truncate text-[14px] ${
                      todo.completed ? "text-muted line-through" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => startEdit(todo)}
                    className="shrink-0 rounded p-1.5 text-muted opacity-0 transition-opacity hover:text-[var(--text-secondary)] group-hover:opacity-100"
                    aria-label="Edit todo"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(todo)}
                    disabled={busyId === todo.id}
                    className="shrink-0 rounded p-1.5 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 disabled:opacity-50"
                    aria-label="Delete todo"
                  >
                    {busyId === todo.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
