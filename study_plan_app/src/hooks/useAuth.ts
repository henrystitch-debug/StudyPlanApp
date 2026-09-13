"use client";

import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Shared auth state across the app. Sign-in/sign-up hit real DB-backed
// routes (/api/auth/login, /api/auth/register); this hook tracks which
// user (id + email) is currently signed in, in localStorage (+ a matching
// cookie for future server use).
// ---------------------------------------------------------------------------

const SESSION_KEY = "study-plan-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = { userId: number; email: string };

// --- email + password format rules (still used for client-side validation) ---

export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com", "googlemail.com", "gmx.de", "gmx.net", "gmx.com",
  "icloud.com", "me.com", "outlook.com", "outlook.de", "hotmail.com",
  "hotmail.de", "live.com", "yahoo.com", "yahoo.de", "web.de",
  "proton.me", "protonmail.com", "t-online.de", "tha.de", "ulster.ac.uk",
  "studyplan.app",
];

export function isAllowedEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  const domain = value.slice(value.lastIndexOf("@") + 1);
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
  );
}

export const ADMIN_ACCOUNT = {
  email: "admin@studyplan.app",
  password: "admin1234",
};

// --- shared session store (userId + email together) -----------------------

const listeners = new Set<() => void>();
let cache: SessionUser | null | undefined = undefined;

function readSession(): SessionUser | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(user: SessionUser | null) {
  try {
    if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = user
    ? `session=${user.userId}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`
    : "session=; path=/; max-age=0; samesite=lax";

  cache = user;
  listeners.forEach((l) => l());
}

function handleStorage(e: StorageEvent) {
  if (e.key !== SESSION_KEY) return;
  cache = readSession();
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

function getSnapshot(): SessionUser | null {
  if (cache === undefined) cache = readSession();
  return cache;
}

function getServerSnapshot(): SessionUser | null {
  return null;
}

export function useAuth() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback((user: SessionUser) => {
    setSession(user);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  return {
    userId: session?.userId ?? null,
    email: session?.email ?? null,
    isAuthed: Boolean(session),
    signIn,
    signOut,
  };
}