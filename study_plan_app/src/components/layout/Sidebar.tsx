"use client";

import { Plus, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/constants";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-[var(--scrim)] backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-panel-border bg-[var(--sidebar)] px-4 py-5 transition-transform duration-300 ease-out md:static md:z-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-300 to-accent" />
            <span className="text-[20px] font-semibold tracking-tight text-foreground font-serif">
              Study Learn App
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-[var(--overlay)] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14.5px] transition-colors ${
                active
                  ? "bg-[var(--overlay-strong)] text-foreground"
                  : "text-muted hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-7 px-3">
          <p className="mb-2 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Subjects
          </p>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[14.5px] text-[var(--text-secondary)] hover:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              art
            </button>
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[14.5px] text-muted hover:text-[var(--text-secondary)]">
              <Plus size={13} />
              New subject
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-panel-border px-1 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500" />
            <span className="text-[14px] text-[var(--text-secondary)]">Manar Khayi</span>
          </div>
          <button className="text-[13px] text-muted hover:text-[var(--text-secondary)]">
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
