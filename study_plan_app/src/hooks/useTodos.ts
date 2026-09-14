"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TodoItem } from "@/components/dashboard/types";
import { INITIAL_TODOS } from "@/components/dashboard/constants";

// ---------------------------------------------------------------------------
// Shared to-do list, backed by localStorage so the dashboard widget and the
// full /todo page always show the same data — same module-store +
// useSyncExternalStore shape as useAuth/useTheme, so every caller (and every
// browser tab) stays in sync.
// ---------------------------------------------------------------------------

const TODOS_KEY = "study-plan-todos";

const listeners = new Set<() => void>();
let cache: TodoItem[] | undefined;

function readTodos(): TodoItem[] {
  try {
    const raw = window.localStorage.getItem(TODOS_KEY);
    return raw ? (JSON.parse(raw) as TodoItem[]) : INITIAL_TODOS;
  } catch {
    return INITIAL_TODOS;
  }
}

function writeTodos(next: TodoItem[]) {
  cache = next;
  try {
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function handleStorage(e: StorageEvent) {
  if (e.key !== TODOS_KEY) return;
  cache = readTodos();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot(): TodoItem[] {
  if (cache === undefined) cache = readTodos();
  return cache;
}

// The server has no localStorage; render the seed list and let the client
// correct it on hydration (useSyncExternalStore handles this without a
// mismatch warning).
function getServerSnapshot(): TodoItem[] {
  return INITIAL_TODOS;
}

export function useTodos() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addTodo = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    writeTodos([...getSnapshot(), { id: `t${Date.now()}`, label: trimmed, done: false }]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    writeTodos(getSnapshot().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTodo = useCallback((id: string) => {
    writeTodos(getSnapshot().filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    writeTodos(getSnapshot().filter((t) => !t.done));
  }, []);

  return { todos, addTodo, toggleTodo, removeTodo, clearCompleted };
}
