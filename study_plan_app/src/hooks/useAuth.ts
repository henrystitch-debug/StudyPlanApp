"use client";

import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Placeholder auth, shared across the whole app.
//
// There is no auth backend yet, so "signed in" just means we kept the user's
// email in localStorage (+ a matching `session` cookie for future server use).
//
// The state lives in a single module-level store read through
// useSyncExternalStore, so every useAuth() caller stays in sync with the
// others AND with other browser tabs (via the `storage` event). Swap the
// bodies of signIn/signOut for real API calls later.
// ---------------------------------------------------------------------------

const EMAIL_KEY = "study-plan-email";
const ACCOUNTS_KEY = "study-plan-accounts";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Built-in admin account – always works, even in a fresh browser. Handy for
// development until there is a real user database.
export const ADMIN_ACCOUNT = {
  email: "admin@studyplan.app",
  password: "admin1234",
};

// --- email + password rules ----------------------------------------------

// Only mainstream providers (plus our uni + admin domains) are accepted.
export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "gmx.de",
  "gmx.net",
  "gmx.com",
  "icloud.com",
  "me.com",
  "outlook.com",
  "outlook.de",
  "hotmail.com",
  "hotmail.de",
  "live.com",
  "yahoo.com",
  "yahoo.de",
  "web.de",
  "proton.me",
  "protonmail.com",
  "t-online.de",
  "tha.de",
  "ulster.ac.uk",
  "studyplan.app",
];

/** A syntactically valid address whose domain is on the allow-list. */
export function isAllowedEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  const domain = value.slice(value.lastIndexOf("@") + 1);
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/** At least 8 characters, containing a letter and a number. */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
  );
}

// --- account store (email -> password) -------------------------------------

type Accounts = Record<string, string>;

function readAccounts(): Accounts {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Remember a newly created account so it can sign in again later. */
export function registerAccount(email: string, password: string) {
  try {
    const accounts = readAccounts();
    accounts[email.trim().toLowerCase()] = password;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore */
  }
}

/** True if the credentials match the admin account or a registered one. */
export function verifyCredentials(email: string, password: string): boolean {
  const key = email.trim().toLowerCase();
  if (key === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
    return true;
  }
  return readAccounts()[key] === password;
}

/** True if an account (admin or registered) exists for this email. */
export function accountExists(email: string): boolean {
  const key = email.trim().toLowerCase();
  return key === ADMIN_ACCOUNT.email || key in readAccounts();
}

/**
 * Set a new password for an existing registered account.
 * Returns false if there is no such account (or it's the admin one).
 */
export function resetPassword(email: string, newPassword: string): boolean {
  const key = email.trim().toLowerCase();
  if (key === ADMIN_ACCOUNT.email) return false;
  if (!(key in readAccounts())) return false;
  registerAccount(key, newPassword);
  return true;
}

// --- shared session store -------------------------------------------------

const listeners = new Set<() => void>();

// `cache` is the single source of truth handed to React. `undefined` means we
// have not read localStorage yet; after that it is a string or null.
let cache: string | null | undefined = undefined;

function readEmail(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

function setSession(email: string | null) {
  try {
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
    else window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = email
    ? `session=${encodeURIComponent(email)}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`
    : "session=; path=/; max-age=0; samesite=lax";

  cache = email;
  listeners.forEach((l) => l());
}

function handleStorage(e: StorageEvent) {
  if (e.key !== EMAIL_KEY) return;
  cache = readEmail();
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

function getSnapshot(): string | null {
  if (cache === undefined) cache = readEmail();
  return cache;
}

// The server has no session; render as signed-out and let the client correct it.
function getServerSnapshot(): string | null {
  return null;
}

export function useAuth() {
  const email = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback((nextEmail: string) => {
    setSession(nextEmail.trim().toLowerCase());
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  return { email, isAuthed: Boolean(email), signIn, signOut };
}
