"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GraduationCap, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/constants";
import { useAuth } from "@/hooks/useAuth";
import { AvatarPicker } from "./AvatarPicker";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, userId, signOut } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const url = new URL("/api/user/userGet", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          setUserName(data.user?.name ?? null);
          setAvatar(data.user?.avatar ?? null);
        }
      } catch {
        // No fallback needed - the row just doesn't render.
      }
    };

    fetchUser();
  }, [userId]);

  const displayName = userName ?? email?.split("@")[0] ?? "Guest";
  const initial = displayName.charAt(0).toUpperCase();

  const changeAvatar = async (next: string | null) => {
    const previous = avatar;
    setAvatar(next); // optimistic
    if (!userId) return;
    try {
      const res = await fetch("/api/user/userAvatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, avatar: next }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
      console.error(err);
      setAvatar(previous);
    }
  };

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

  // A finished quiz that bumps the streak (see courses/page.tsx) dispatches
  // this once its flying-flame animation lands here, so the sidebar's own
  // flame can visibly "catch" it — a brief pulse, not a persistent state.
  const [refueling, setRefueling] = useState(false);
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleRefuel = () => {
      setRefueling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setRefueling(false), 800);
    };
    window.addEventListener("streak:refuel", handleRefuel);
    return () => {
      window.removeEventListener("streak:refuel", handleRefuel);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 transform flex-col border-r border-panel-border bg-[var(--sidebar)] shadow-[var(--sidebar-shadow)] transition-transform md:sticky md:top-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-panel-border px-5 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <GraduationCap size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold leading-tight text-foreground font-serif">
              StudyMaxxing
            </p>
            <p className="truncate text-[11.5px] text-muted">Plan. Focus. Learn.</p>
          </div>
        </div>

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
                className={`group flex items-center gap-3 rounded-lg border-l-2 px-2.5 py-2 text-[14px] transition-colors ${
                  isActive
                    ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/10 font-medium text-[var(--accent-strong)]"
                    : isDisabled
                    ? "cursor-not-allowed border-transparent text-muted opacity-50"
                    : "border-transparent text-muted hover:border-panel-border hover:bg-[var(--overlay)] hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    item.label === "Streak" ? "relative" : ""
                  }`}
                  style={{
                    backgroundColor: `${item.color}${isActive ? "26" : "1a"}`,
                    color: item.color,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  {item.label === "Streak" &&
                    refueling &&
                    [0, 1].map((i) => (
                      <span key={i} className="streak-catch-ring" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  <Icon
                    size={16}
                    {...(item.label === "Streak" ? { "data-streak-nav-icon": "" } : {})}
                    className={item.label === "Streak" && refueling ? "streak-flame-pulse" : undefined}
                  />
                </span>
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

        <div className="border-t border-panel-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <AvatarPicker avatar={avatar} initial={initial} onChange={changeAvatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-foreground">
                {displayName}
              </p>
              {email && (
                <p className="truncate text-[11.5px] text-muted" title={email}>
                  {email}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[var(--overlay)] hover:text-[var(--rose)]"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}