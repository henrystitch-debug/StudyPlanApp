"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LogOut, Mail, User } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/constants";
import { useAuth } from "@/hooks/useAuth";

// TODO: durch echte uid aus einem Login/Auth-System ersetzen, sobald es das gibt.
const CURRENT_UID = 1;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, signOut } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user?uid=${CURRENT_UID}`);
        const data = await response.json();

        if (response.ok) {
          setUserName(data.userInfo?.name ?? null);
        }
      } catch {
        // Kein Fallback nötig - die Zeile wird dann einfach nicht angezeigt.
      }
    };

    fetchUser();
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  const updateScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 4);
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    updateScroll();
    const el = navRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  const handleScrollClick = () => {
    const el = navRef.current;
    if (!el) return;
    if (atBottom) el.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollBy({ top: el.clientHeight * 0.7, behavior: "smooth" });
  };

  const handleSignOut = () => {
    signOut();
    onClose();
    router.replace("/login");
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 transform flex-col border-r border-panel-border bg-[var(--sidebar)] transition-transform md:sticky md:top-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav
          ref={navRef}
          className="sidebar-nav flex flex-1 flex-col gap-1 overflow-y-auto p-4"
        >
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

        {overflowing && (
          <button
            type="button"
            onClick={handleScrollClick}
            aria-label={atBottom ? "Scroll to top" : "Scroll down"}
            className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full border border-panel-border bg-[var(--panel)] text-muted shadow-sm transition-colors hover:text-foreground"
          >
            {atBottom ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}

        <div className="border-t border-panel-border p-4">
          {userName && (
            <div className="mb-2 flex items-center gap-2.5 px-3 py-1 text-[13px] font-medium text-foreground">
              <User size={15} className="shrink-0" />
              <span className="truncate">{userName}</span>
            </div>
          )}
          {email && (
            <div className="mb-2 flex items-center gap-2.5 px-3 py-1 text-[12.5px] text-muted">
              <Mail size={15} className="shrink-0" />
              <span className="truncate" title={email}>
                {email}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-muted hover:bg-[var(--overlay)] hover:text-[var(--rose)]"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
