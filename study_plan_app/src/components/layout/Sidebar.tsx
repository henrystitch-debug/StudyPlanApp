"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/dashboard/constants";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
            const isActive = item.href !== "#" && pathname === item.href;
            const isDisabled = item.href === "#";

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (isDisabled) return;
                  onClose();
                }}
                aria-disabled={isDisabled}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] ${
                  isActive
                    ? "bg-[var(--accent-strong)]/10 font-medium text-[var(--accent-strong)]"
                    : isDisabled
                    ? "cursor-not-allowed text-muted opacity-50"
                    : "text-muted hover:bg-[var(--overlay)]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
