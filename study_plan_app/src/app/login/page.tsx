"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  CalendarDays,
  ClipboardList,
  Flame,
  MailCheck,
  Sun,
  Moon,
} from "lucide-react";
import {
  useAuth,
  registerAccount,
  verifyCredentials,
  accountExists,
  resetPassword,
  isAllowedEmail,
  isValidPassword,
  ADMIN_ACCOUNT,
} from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Login screen for the same app as the calendar page — a study planner.
// Left: brand panel — a living "orbit" of scheduled days + what the app does.
// Right: the sign-in / create-account / reset form.
// ---------------------------------------------------------------------------

const CSS = `
  .lp-root {
    --bg: #0a0d1a;
    --panel: #12162a;
    --panel-border: rgba(255, 255, 255, 0.06);
    --overlay: rgba(255, 255, 255, 0.04);
    --overlay-strong: rgba(255, 255, 255, 0.08);
    --fg: #ededf3;
    --fg-secondary: #cbd5e1;
    --muted: #7c8399;
    --accent: #f6a934;
    --accent-foreground: #1a1305;
    --accent-strong: #fde68a;
    --rose: #fb7185;
    --emerald: #7fae86;
    --glow-soft: 0 0 0 1px rgba(246, 169, 52, 0.18), 0 2px 18px rgba(246, 169, 52, 0.12);

    position: relative;
    min-height: 100vh;
    width: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: Arial, Helvetica, sans-serif;
    display: grid;
    grid-template-columns: 1.05fr 1fr;
  }

  /* Light mode — driven by the app-wide .light class on <html> (useTheme). */
  :root.light .lp-root {
    --bg: #eef1fa;
    --panel: #ffffff;
    --panel-border: rgba(18, 20, 42, 0.1);
    --overlay: rgba(18, 20, 70, 0.05);
    --overlay-strong: rgba(18, 20, 70, 0.1);
    --fg: #12142a;
    --fg-secondary: #2a2c52;
    --muted: #565a86;
    --accent-strong: #c2660c;
    --rose: #e11d48;
    --emerald: #4b7a52;
    --glow-soft: 0 0 0 1px rgba(246, 169, 52, 0.28), 0 2px 18px rgba(246, 169, 52, 0.18);
  }
  :root.light .lp-brand::before { opacity: 0.5; }
  :root.light .lp-brand::after { opacity: 0.5; }
  /* a plain overlay wash reads as "disabled" on white — lift the active tab instead */
  :root.light .lp-tab-pill {
    background: var(--panel);
    box-shadow: 0 1px 3px rgba(18, 20, 42, 0.12), 0 0 0 1px rgba(18, 20, 42, 0.06);
  }

  .lp-theme-toggle {
    position: absolute;
    top: 18px;
    right: 18px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--panel-border);
    background: var(--overlay);
    color: var(--fg-secondary);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.2s ease;
  }
  .lp-theme-toggle:hover {
    background: var(--overlay-strong);
    color: var(--fg);
    box-shadow: var(--glow-soft);
  }

  @media (max-width: 860px) {
    .lp-root { grid-template-columns: 1fr; }
    .lp-brand { min-height: 200px !important; padding: 28px 24px !important; }
    .lp-form-col { padding: 36px 22px 52px !important; }
    .lp-orbit, .lp-features { display: none !important; }
  }

  .lp-brand {
    position: relative;
    background: var(--bg);
    border-right: 1px solid var(--panel-border);
    padding: 56px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  /* ambient glow — a faint amber/indigo drift over the dark ground */
  .lp-brand::before, .lp-brand::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }
  .lp-brand::before {
    width: 360px; height: 360px; top: -130px; left: -110px;
    background: radial-gradient(circle, rgba(246, 169, 52, 0.20), transparent 70%);
  }
  .lp-brand::after {
    width: 420px; height: 420px; bottom: -170px; right: -130px;
    background: radial-gradient(circle, rgba(116, 110, 214, 0.18), transparent 70%);
  }

  .lp-mark {
    position: relative;
    font-family: Georgia, serif;
    font-size: 20px;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 2;
  }

  .lp-mark-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 12px rgba(246, 169, 52, 0.7);
  }

  .lp-brand-body { position: relative; z-index: 2; }

  .lp-quote {
    font-family: Georgia, serif;
    font-size: clamp(25px, 2.9vw, 33px);
    line-height: 1.28;
    color: var(--fg);
    max-width: 460px;
    font-weight: 400;
  }

  .lp-quote span { color: var(--muted); }

  .lp-features {
    list-style: none;
    margin: 26px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  .lp-features li {
    display: flex;
    align-items: center;
    gap: 11px;
    font-size: 13.5px;
    color: var(--fg-secondary);
  }
  .lp-features svg { color: var(--accent); flex-shrink: 0; }

  .lp-quote-attr {
    position: relative;
    margin-top: 20px;
    font-size: 13px;
    color: var(--muted);
    z-index: 2;
  }

  .lp-orbit {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 10px;
    padding: 56px;
    opacity: 0.5;
    pointer-events: none;
    z-index: 1;
  }

  .lp-orbit-cell {
    border: 1px solid var(--panel-border);
    border-radius: 8px;
  }

  .lp-orbit-cell.lit { border-color: transparent; background: var(--overlay); }
  .lp-orbit-cell.dot::after {
    content: "";
    display: block;
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent);
    margin: 6px;
  }

  .lp-form-col {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px;
  }

  .lp-form-wrap { width: 100%; max-width: 384px; }

  .lp-h1 {
    font-family: Georgia, serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--fg);
    margin: 0 0 6px;
  }

  .lp-sub {
    font-size: 13.5px;
    color: var(--muted);
    margin: 0 0 26px;
    line-height: 1.5;
  }

  .lp-sub button, .lp-linkbtn {
    background: none; border: none; padding: 0;
    color: var(--accent);
    font-size: 13.5px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: text-shadow 0.2s ease;
  }
  .lp-sub button:hover, .lp-linkbtn:hover {
    text-shadow: 0 0 12px rgba(246, 169, 52, 0.5);
  }

  .lp-tabs {
    position: relative;
    display: flex;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 24px;
    background: var(--panel);
  }

  .lp-tab {
    position: relative;
    flex: 1;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    padding: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    z-index: 1;
    transition: color 0.2s ease;
  }
  .lp-tab:hover:not(.active) { color: var(--fg-secondary); }
  .lp-tab.active { color: var(--fg); }

  /* sliding pill behind the active tab */
  .lp-tab-pill {
    position: absolute;
    top: 3px; bottom: 3px; left: 3px;
    width: calc(50% - 3px);
    border-radius: 8px;
    background: var(--overlay-strong);
    box-shadow: var(--glow-soft);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .lp-field { margin-bottom: 15px; }

  .lp-label {
    display: block;
    font-size: 12.5px;
    color: var(--fg-secondary);
    margin-bottom: 6px;
  }

  .lp-input-shell {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: var(--panel);
    transition: border-color 0.15s ease, box-shadow 0.2s ease;
  }
  .lp-input-shell:hover { box-shadow: var(--glow-soft); }
  .lp-input-shell:focus-within {
    border-color: var(--accent);
    box-shadow: var(--glow-soft);
  }
  .lp-input-shell.error { border-color: var(--rose); }
  .lp-input-shell.ok { border-color: rgba(127, 174, 134, 0.55); }

  .lp-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--fg);
    font-size: 14px;
    padding: 11px 13px;
    font-family: inherit;
  }
  .lp-input::placeholder { color: var(--muted); }
  .lp-input:read-only { color: var(--fg-secondary); }

  .lp-adorn {
    display: flex;
    align-items: center;
    padding-right: 12px;
    color: var(--emerald);
  }

  .lp-eye {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    padding: 8px 12px 8px 4px;
    display: flex;
    align-items: center;
    transition: color 0.15s ease;
  }
  .lp-eye:hover { color: var(--fg-secondary); }

  .lp-error-text {
    margin-top: 6px;
    font-size: 12px;
    color: var(--rose);
  }

  .lp-form-error {
    margin: 2px 0 14px;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid rgba(251, 113, 133, 0.35);
    background: rgba(251, 113, 133, 0.1);
    font-size: 12.5px;
    color: var(--rose);
  }

  /* password strength */
  .lp-meter { margin-top: 9px; display: flex; align-items: center; gap: 10px; }
  .lp-meter-bars { display: flex; gap: 4px; flex: 1; }
  .lp-meter-seg {
    height: 4px; flex: 1; border-radius: 2px;
    background: var(--overlay-strong);
    transition: background 0.3s ease;
  }
  .lp-meter-label {
    font-size: 11.5px; color: var(--muted);
    min-width: 40px; text-align: right;
  }
  .lp-reqs {
    margin-top: 8px;
    display: flex; flex-wrap: wrap; gap: 5px 12px;
    font-size: 11.5px; color: var(--muted);
  }
  .lp-reqs span { display: flex; align-items: center; gap: 5px; transition: color 0.2s ease; }
  .lp-reqs span::before {
    content: ""; width: 5px; height: 5px; border-radius: 50%;
    background: currentColor; opacity: 0.5;
  }
  .lp-reqs span.ok { color: var(--emerald); }
  .lp-reqs span.ok::before { opacity: 1; }

  .lp-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 12px 0 20px;
  }

  .lp-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--fg-secondary);
    cursor: pointer;
    user-select: none;
  }

  .lp-checkbox {
    width: 16px; height: 16px;
    border-radius: 5px;
    border: 1px solid var(--panel-border);
    background: var(--panel);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }
  .lp-remember:hover .lp-checkbox { border-color: var(--muted); }
  .lp-checkbox.checked {
    background: var(--accent);
    border-color: var(--accent);
    transform: scale(1.05);
  }

  .lp-forgot {
    background: none; border: none;
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
  }
  .lp-forgot:hover { color: var(--fg-secondary); }

  .lp-submit {
    width: 100%;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-foreground);
    font-size: 14px;
    font-weight: 600;
    padding: 12px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: filter 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease;
  }
  .lp-submit svg { transition: transform 0.2s ease; }
  .lp-submit:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: var(--glow-soft);
    transform: translateY(-1px);
  }
  .lp-submit:hover:not(:disabled) svg { transform: translateX(3px); }
  .lp-submit:active:not(:disabled) { transform: scale(0.99); }
  .lp-submit:disabled { opacity: 0.6; cursor: default; }

  .lp-spinner {
    width: 15px; height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(20,20,15,0.35);
    border-top-color: var(--accent-foreground);
    animation: lp-spin 0.7s linear infinite;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  .lp-demo {
    margin-top: 14px;
    width: 100%;
    background: var(--overlay);
    border: 1px dashed var(--panel-border);
    color: var(--muted);
    font-size: 12px;
    padding: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .lp-demo:hover {
    color: var(--fg-secondary);
    border-color: var(--muted);
    background: var(--overlay-strong);
  }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
    color: var(--muted);
    font-size: 12px;
  }
  .lp-divider::before, .lp-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--panel-border);
  }

  .lp-social { display: flex; gap: 10px; }

  .lp-social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--fg-secondary);
    border-radius: 10px;
    padding: 10px 0;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, transform 0.1s ease;
  }
  .lp-social-btn svg { display: block; }
  .lp-social-btn:hover:not(:disabled) {
    background: var(--overlay);
    border-color: var(--muted);
    box-shadow: var(--glow-soft);
    transform: translateY(-1px);
  }
  .lp-social-btn:disabled { opacity: 0.6; cursor: default; }

  .lp-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid var(--panel-border);
    background: var(--overlay);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--fg-secondary);
    line-height: 1.45;
    margin-bottom: 18px;
  }
  .lp-note svg { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
  .lp-note span { color: var(--muted); }

  .lp-success {
    border: 1px solid var(--emerald);
    background: rgba(127,174,134,0.1);
    border-radius: 10px;
    padding: 15px 16px;
    font-size: 13.5px;
    color: var(--fg);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .lp-success svg { color: var(--emerald); flex-shrink: 0; }

  @media (prefers-reduced-motion: no-preference) {
    .lp-brand::before { animation: lp-float 20s ease-in-out infinite; }
    .lp-brand::after  { animation: lp-float 24s ease-in-out infinite reverse; }
    .lp-orbit-cell.dot::after { animation: lp-pulse 3.4s ease-in-out infinite; }
    .lp-orbit-cell.dot:nth-child(3n)::after { animation-delay: -1.6s; }
    .lp-anim-in { animation: lp-fade-up 0.38s ease both; }
    .lp-success { animation: lp-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  }

  @keyframes lp-float {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(24px, -28px, 0) scale(1.1); }
  }
  @keyframes lp-pulse {
    0%, 100% { opacity: 0.35; transform: scale(0.75); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-pop {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const ORBIT_LIT = new Set([2, 5, 9, 13, 16, 20, 24, 27, 31, 35, 38, 40]);
const ORBIT_DOT = new Set([9, 20, 27, 38]);

type Mode = "signin" | "signup" | "reset";

// 0..4 — used for the strength meter (only shown when setting a new password).
function passwordScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const SCORE_LABEL = ["Weak", "Weak", "Fair", "Good", "Strong"];

function scoreColor(s: number): string {
  if (s <= 1) return "var(--rose)";
  if (s === 2) return "var(--accent)";
  if (s === 3) return "var(--accent-strong)";
  return "var(--emerald)";
}

type FieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string | null;
  ok?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
};

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  ok,
  autoComplete,
  autoFocus,
}: FieldProps) {
  return (
    <div className="lp-field">
      <label className="lp-label">{label}</label>
      <div
        className={`lp-input-shell${error ? " error" : ok ? " ok" : ""}`}
      >
        <input
          className="lp-input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        {ok && !error && (
          <span className="lp-adorn">
            <Check size={15} strokeWidth={2.5} />
          </span>
        )}
      </div>
      {error && (
        <div className="lp-error-text" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

type AuthResult = { ok: boolean; error?: string; fallback?: boolean };

// Talk to the auth routes:
//   POST /api/user/userGet     -> verify credentials (sign in)
//   POST /api/user/userCreate  -> register a new account (sign up)
// The backend + database are still being built, so when a route doesn't
// answer (or answers "not implemented") we fall back to the local placeholder
// auth from useAuth and the page keeps working. Once the routes handle these
// POSTs for real, the fallback stops being hit.
async function postJSON(
  url: string,
  payload: Record<string, unknown>,
): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return null; // network error / server unreachable -> caller falls back
  }
}

async function requestSignIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await postJSON("/api/user/userGet", { email, password });
  if (res && (res.status === 401 || res.status === 403)) {
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error ?? "Wrong email or password." };
  }
  if (res && res.ok) return { ok: true };
  // Backend not ready — verify against the local placeholder store.
  if (verifyCredentials(email, password)) return { ok: true, fallback: true };
  return { ok: false, error: "Wrong email or password." };
}

async function requestSignUp(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const res = await postJSON("/api/user/userCreate", { email, password, name });
  if (res && res.status === 409) {
    const body = await res.json().catch(() => null);
    return {
      ok: false,
      error: body?.error ?? "An account with that email already exists.",
    };
  }
  if (res && res.ok) return { ok: true };
  // Backend not ready — register in the local placeholder store instead.
  return { ok: true, fallback: true };
}

// The app-wide theme lives on <html> as the `.light` class plus the
// "study-learn-theme" localStorage key (see AppShell / useTheme). AppShell
// renders no chrome on /login, so we drive a toggle here that reads and
// writes exactly those. Same module-store + useSyncExternalStore shape as
// useAuth, so it hydrates cleanly and every caller stays in sync.
const THEME_KEY = "study-learn-theme";

const themeListeners = new Set<() => void>();
let lightCache: boolean | undefined;

function readLight(): boolean {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored) return stored === "light";
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function setLight(next: boolean) {
  document.documentElement.classList.toggle("light", next);
  try {
    window.localStorage.setItem(THEME_KEY, next ? "light" : "dark");
  } catch {
    /* ignore */
  }
  lightCache = next;
  themeListeners.forEach((l) => l());
}

function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => themeListeners.delete(cb);
}

function getLightSnapshot(): boolean {
  if (lightCache === undefined) lightCache = readLight();
  return lightCache;
}

function useLoginTheme() {
  const light = useSyncExternalStore(
    subscribeTheme,
    getLightSnapshot,
    () => false, // server: render dark, correct on the client
  );

  // Keep <html> in step with what we read (AppShell does this too; harmless).
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  return { light, toggle: () => setLight(!getLightSnapshot()) };
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthed } = useAuth();
  const { light, toggle: toggleTheme } = useLoginTheme();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Password reset is a two-step flow: "request" (enter email, we "send" a
  // link) then "confirm" (set the new password).
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");

  // Already signed in? Skip the form.
  useEffect(() => {
    if (isAuthed) router.replace("/");
  }, [isAuthed, router]);

  // Only the "confirm" step of a reset asks for a password.
  const needsPassword =
    mode === "signin" || mode === "signup" || resetStep === "confirm";
  const needsConfirm = mode === "reset" && resetStep === "confirm";
  const settingNewPassword = mode === "signup" || needsConfirm;

  const emailValid = isAllowedEmail(email);
  const passwordValid = !needsPassword
    ? true
    : mode === "signin"
    ? password.length > 0
    : isValidPassword(password);
  const nameValid = mode !== "signup" || name.trim().length > 1;
  const confirmValid = !needsConfirm || confirmPassword === password;

  const emailError =
    touched && !emailValid
      ? "Use a valid email from gmail, gmx, icloud, outlook, tha.de, ulster.ac.uk…"
      : null;
  const passwordError =
    touched && !passwordValid
      ? mode === "signin"
        ? "Enter your password."
        : "At least 8 characters, including a letter and a number."
      : null;
  const nameError = touched && !nameValid ? "Tell us what to call you." : null;
  const confirmError =
    touched && needsConfirm && !confirmValid ? "Passwords do not match." : null;

  const canSubmit = emailValid && passwordValid && nameValid && confirmValid;

  const score = passwordScore(password);
  const reqLen = password.length >= 8;
  const reqLetter = /[A-Za-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!canSubmit || loading) return;

    // Step 1 of a reset: pretend to send the email, then reveal the
    // new-password step. We never say whether the account exists.
    if (mode === "reset" && resetStep === "request") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setTouched(false);
        setResetStep("confirm");
      }, 900);
      return;
    }

    if (mode === "reset" && resetStep === "confirm") {
      if (email.trim().toLowerCase() === ADMIN_ACCOUNT.email) {
        setFormError("The demo admin password can't be changed.");
        return;
      }
      if (!accountExists(email)) {
        setFormError("No account found for that email.");
        return;
      }
      setLoading(true);
      setSuccess(false);
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        resetPassword(email, password); // stay on the page, sign in with the new password
      }, 1100);
      return;
    }

    // Sign in / sign up go through the API routes.
    void submitAuth();
  };

  const submitAuth = async () => {
    const addr = email.trim().toLowerCase();
    setLoading(true);
    setSuccess(false);
    try {
      const result =
        mode === "signup"
          ? await requestSignUp(addr, password, name.trim())
          : await requestSignIn(addr, password);

      if (!result.ok) {
        setLoading(false);
        setFormError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Backend not ready yet — keep the local placeholder store in sync so a
      // page reload still recognises the account.
      if (result.fallback && mode === "signup") {
        registerAccount(email.trim(), password);
      }

      setLoading(false);
      setSuccess(true);
      signIn(addr);
      router.replace("/");
      router.refresh();
    } catch {
      setLoading(false);
      setFormError("Something went wrong. Please try again.");
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setTouched(false);
    setSuccess(false);
    setFormError(null);
    setPassword("");
    setConfirmPassword("");
    setResetStep("request");
  };

  // Placeholder social sign-in – no real OAuth yet, just drops you in with a
  // demo account so the buttons do something. Swap for Auth.js later.
  const handleSocial = (provider: "google" | "apple") => {
    if (loading) return;
    const demoEmail = provider === "google" ? "you@gmail.com" : "you@icloud.com";
    setFormError(null);
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      registerAccount(demoEmail, "");
      signIn(demoEmail);
      router.replace("/");
      router.refresh();
    }, 900);
  };

  const fillDemo = () => {
    setEmail(ADMIN_ACCOUNT.email);
    setPassword(ADMIN_ACCOUNT.password);
    setFormError(null);
    setTouched(false);
  };

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
      ? "Set up your planner"
      : resetStep === "request"
      ? "Reset your password"
      : "Choose a new password";

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      <button
        type="button"
        className="lp-theme-toggle"
        onClick={toggleTheme}
        aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      >
        {light ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      <div className="lp-brand">
        <div className="lp-orbit" aria-hidden="true">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className={`lp-orbit-cell${ORBIT_LIT.has(i) ? " lit" : ""}${
                ORBIT_DOT.has(i) ? " dot" : ""
              }`}
            />
          ))}
        </div>

        <div className="lp-mark">
          <span className="lp-mark-dot" />
          StudyPlanApp
        </div>

        <div className="lp-brand-body">
          <div className="lp-quote">
            Every exam, deadline and study block, <span>held in one calm place.</span>
          </div>
          <ul className="lp-features">
            <li>
              <CalendarDays size={16} />
              Every exam and deadline on one calendar
            </li>
            <li>
              <ClipboardList size={16} />
              Study plans built from your own material
            </li>
            <li>
              <Flame size={16} />
              Streaks and focus sessions that keep momentum
            </li>
          </ul>
          <div className="lp-quote-attr">Plan the month. Show up for the day.</div>
        </div>
      </div>

      <div className="lp-form-col">
        <div className="lp-form-wrap">
          {mode !== "reset" && (
            <div className="lp-tabs">
              <span
                className="lp-tab-pill"
                style={{
                  transform:
                    mode === "signup" ? "translateX(100%)" : "translateX(0)",
                }}
              />
              <button
                className={`lp-tab${mode === "signin" ? " active" : ""}`}
                onClick={() => switchMode("signin")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`lp-tab${mode === "signup" ? " active" : ""}`}
                onClick={() => switchMode("signup")}
                type="button"
              >
                Create account
              </button>
            </div>
          )}

          <div className="lp-anim-in" key={`${mode}-${resetStep}-${success}`}>
            <h1 className="lp-h1">{heading}</h1>
            <p className="lp-sub">
              {mode === "signin" ? (
                <>
                  New here?{" "}
                  <button type="button" onClick={() => switchMode("signup")}>
                    Create an account
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Already have one?{" "}
                  <button type="button" onClick={() => switchMode("signin")}>
                    Sign in instead
                  </button>
                </>
              ) : (
                <>
                  {resetStep === "request"
                    ? "Enter your email and we'll send you a reset link."
                    : "Almost done — pick something you'll remember."}{" "}
                  <button type="button" onClick={() => switchMode("signin")}>
                    Back to sign in
                  </button>
                </>
              )}
            </p>

            {success ? (
              <div className="lp-success">
                <Check size={16} strokeWidth={2.5} />
                {mode === "signin"
                  ? "Signed in. Taking you to your dashboard…"
                  : mode === "signup"
                  ? "Account created. Welcome aboard."
                  : "Password updated. Sign in with your new password."}
                {mode === "reset" && (
                  <button
                    type="button"
                    className="lp-linkbtn"
                    onClick={() => switchMode("signin")}
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {needsConfirm && (
                  <div className="lp-note">
                    <MailCheck size={16} />
                    <div>
                      If an account exists for {email}, a reset link is on its way.{" "}
                      <span>(Demo — no real email is sent; continue below.)</span>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <Field
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we address you?"
                    error={nameError}
                    autoComplete="name"
                    autoFocus
                  />
                )}

                {needsConfirm ? (
                  <div className="lp-field">
                    <label className="lp-label">Email</label>
                    <div className="lp-input-shell">
                      <input className="lp-input" value={email} readOnly />
                    </div>
                  </div>
                ) : (
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="forename.surname@tha.de"
                    error={emailError}
                    ok={emailValid}
                    autoComplete="email"
                    autoFocus={mode !== "signup"}
                  />
                )}

                {needsPassword && (
                  <div className="lp-field">
                    <label className="lp-label">
                      {mode === "signin" ? "Password" : "New password"}
                    </label>
                    <div
                      className={`lp-input-shell${passwordError ? " error" : ""}`}
                    >
                      <input
                        className="lp-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          mode === "signin"
                            ? "Your password"
                            : "8+ chars, a letter and a number"
                        }
                        autoComplete={
                          mode === "signin" ? "current-password" : "new-password"
                        }
                        autoFocus={needsConfirm}
                      />
                      <button
                        type="button"
                        className="lp-eye"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {settingNewPassword && password.length > 0 ? (
                      <>
                        <div className="lp-meter">
                          <div className="lp-meter-bars">
                            {[0, 1, 2, 3].map((i) => (
                              <span
                                key={i}
                                className="lp-meter-seg"
                                style={
                                  i < score
                                    ? { background: scoreColor(score) }
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                          <span
                            className="lp-meter-label"
                            style={{ color: scoreColor(score) }}
                          >
                            {SCORE_LABEL[score]}
                          </span>
                        </div>
                        <div className="lp-reqs">
                          <span className={reqLen ? "ok" : ""}>8+ characters</span>
                          <span className={reqLetter ? "ok" : ""}>a letter</span>
                          <span className={reqNumber ? "ok" : ""}>a number</span>
                        </div>
                      </>
                    ) : (
                      passwordError && (
                        <div className="lp-error-text" role="alert">
                          {passwordError}
                        </div>
                      )
                    )}
                  </div>
                )}

                {needsConfirm && (
                  <div className="lp-field">
                    <label className="lp-label">Confirm new password</label>
                    <div
                      className={`lp-input-shell${confirmError ? " error" : ""}`}
                    >
                      <input
                        className="lp-input"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat the new password"
                        autoComplete="new-password"
                      />
                    </div>
                    {confirmError && (
                      <div className="lp-error-text" role="alert">
                        {confirmError}
                      </div>
                    )}
                  </div>
                )}

                {mode !== "reset" && (
                  <div className="lp-row">
                    <label
                      className="lp-remember"
                      onClick={() => setRemember((r) => !r)}
                    >
                      <span className={`lp-checkbox${remember ? " checked" : ""}`}>
                        {remember && (
                          <Check size={11} color="#1a1305" strokeWidth={3} />
                        )}
                      </span>
                      Remember me
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="lp-forgot"
                        onClick={() => switchMode("reset")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                )}

                {formError && <div className="lp-form-error" role="alert">{formError}</div>}

                <button className="lp-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="lp-spinner" />
                  ) : (
                    <>
                      {mode === "signin"
                        ? "Sign in"
                        : mode === "signup"
                        ? "Create account"
                        : resetStep === "request"
                        ? "Send reset link"
                        : "Update password"}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {mode === "signin" && (
                  <button type="button" className="lp-demo" onClick={fillDemo}>
                    Fill in the demo admin account
                  </button>
                )}

                {mode !== "reset" && (
                  <>
                    <div className="lp-divider">or continue with</div>
                    <div className="lp-social">
                      <button
                        type="button"
                        className="lp-social-btn"
                        onClick={() => handleSocial("google")}
                        disabled={loading}
                      >
                        <GoogleIcon />
                        Google
                      </button>
                      <button
                        type="button"
                        className="lp-social-btn"
                        onClick={() => handleSocial("apple")}
                        disabled={loading}
                      >
                        <AppleIcon />
                        Apple
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
