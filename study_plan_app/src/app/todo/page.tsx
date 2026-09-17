"use client";

import { useEffect, useState } from "react";
import { Check, Circle, CircleCheckBig, ListChecks, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function TodoPage() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthed === false) router.replace("/login");
  }, [isAuthed, router]);

  useEffect(() => {
    if (!userId) return;

    const fetchTodos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/todo/todoGetAll?userId=${userId}`);
        const data = await response.json();

        if (response.status === 404) {
          setTodos([]);
          return;
        }
        if (!response.ok) throw new Error(data.error ?? "Couldn't load to-dos");

        const list: Todo[] = (data.todos ?? []).map(
          (row: { to_do_id: number; text: string; completed: boolean }) => ({
            id: row.to_do_id,
            text: row.text,
            completed: row.completed,
          })
        );
        setTodos(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, [userId]);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || !userId) return;

    setIsAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't create to-do");

      setTodos((prev) => [
        ...prev,
        { id: data.todo.to_do_id, text: data.todo.text, completed: data.todo.completed },
      ]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    if (!userId) return;
    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, todoId: todo.id, text: todo.text, completed: !todo.completed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't update to-do");

      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: data.todo.completed } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
    if (!text || !userId) return;

    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch("/api/todo/todoEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, todoId: todo.id, text, completed: todo.completed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't update to-do");

      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, text: data.todo.text } : t)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (!userId) return;
    setBusyId(todo.id);
    setError(null);
    try {
      const response = await fetch(`/api/todo/todoDelete?userId=${userId}&todoId=${todo.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't delete to-do");

      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  };

  const active = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);
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
          disabled={isAdding || !draft.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add
        </button>
      </div>

      {error && <p className="mb-4 text-[12.5px] text-rose">{error}</p>}

      {isLoading ? (
        <p className="text-[13px] text-muted">Loading&hellip;</p>
      ) : total === 0 ? (
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
                    todo={todo}
                    busy={busyId === todo.id}
                    isEditing={editingId === todo.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onToggle={() => handleToggle(todo)}
                    onStartEdit={() => startEdit(todo)}
                    onSaveEdit={() => saveEdit(todo)}
                    onCancelEdit={cancelEdit}
                    onDelete={() => handleDelete(todo)}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="hover-glow rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wider text-muted">
                <CircleCheckBig size={12} />
                Completed
              </h2>
              <div className="flex flex-col gap-1">
                {completed.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    busy={busyId === todo.id}
                    isEditing={editingId === todo.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onToggle={() => handleToggle(todo)}
                    onStartEdit={() => startEdit(todo)}
                    onSaveEdit={() => saveEdit(todo)}
                    onCancelEdit={cancelEdit}
                    onDelete={() => handleDelete(todo)}
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
  todo,
  busy,
  isEditing,
  editText,
  onEditTextChange,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  todo: Todo;
  busy: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (value: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[var(--overlay)]">
      <button
        onClick={onToggle}
        disabled={busy}
        aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
          todo.completed ? "border-accent bg-accent" : "border-panel-border bg-[var(--sunken)] hover:border-accent"
        }`}
      >
        {todo.completed && <Check size={12} strokeWidth={3} className="text-accent-foreground" />}
      </button>

      {isEditing ? (
        <>
          <input
            autoFocus
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="min-w-0 flex-1 rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1 text-[14px] text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={onSaveEdit}
            disabled={busy || !editText.trim()}
            className="shrink-0 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--overlay-strong)] disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="shrink-0 rounded-md px-2 py-1 text-[12px] text-muted hover:text-[var(--text-secondary)]"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span
            className={`flex-1 truncate text-[15px] transition-colors ${
              todo.completed ? "text-muted line-through" : "text-[var(--text-secondary)]"
            }`}
          >
            {todo.text}
          </span>
          <button
            onClick={onStartEdit}
            className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:text-[var(--text-secondary)] group-hover:opacity-100"
            aria-label="Edit task"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            aria-label="Delete task"
            className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          </button>
        </>
      )}
    </div>
  );
}
