"use client";

import { NAV_ITEMS } from "@/components/dashboard/constants";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-panel-border bg-[var(--sunken)] transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
<a key={item.label} href="#"
               
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] ${
                  item.active
                    ? "bg-[var(--accent-strong)]/10 font-medium text-[var(--accent-strong)]"
                    : "text-muted hover:bg-[var(--overlay)]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}