"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sun,
  Moon,
  BookOpen,
  Flame,
  BarChart2,
  Plus,
  X,
  CalendarDays,
  ClipboardList,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export type Theme = "dark" | "light";
const THEME_STORAGE_KEY = "study-learn-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | Theme
      | null;
    const preferred: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

// TODO: confirm these paths match your actual route folders —
// guessed from page names discussed so far (e.g. calendar, courses).
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: Sun, href: "/" },
  { label: "Study", icon: BookOpen, href: "/study" },
  { label: "Courses", icon: Layers, href: "/courses" },
  { label: "Streak", icon: Flame, href: "/streak" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Study Plan", icon: ClipboardList, href: "/study-plan" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
];

type SidebarCourse = { id: number; title: string };

function getInitials(email: string): string {
  const namePart = email.split("@")[0];
  return namePart.slice(0, 2).toUpperCase();
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, email, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [courses, setCourses] = useState<SidebarCourse[]>([]);

  useEffect(() => {
    if (!userId) return;

    async function fetchCourses() {
      try {
        const url = new URL("/api/course/coursesAll", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        // TODO: confirm this matches your real route's response shape
        const list: SidebarCourse[] = (data.courses ?? []).map(
          (c: { course_id: number; title: string }) => ({
            id: c.course_id,
            title: c.title,
          })
        );
        setCourses(list);
      } catch {
        // sidebar course list is non-critical — fail silently rather than
        // showing an error banner in the nav
      }
    }

    fetchCourses();
  }, [userId]);

  const handleLogout = () => {
    signOut();
    router.replace("/login");
  };

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
            <span className="text-[17px] font-medium tracking-tight text-foreground font-serif">
              Study Learn App
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${
                  active
                    ? "bg-[var(--overlay-strong)] text-foreground"
                    : "text-muted hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-7 px-3">
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-wider text-muted">
            Courses
          </p>
          <div className="flex flex-col gap-0.5">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses?courseId=${course.id}`}
                className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-[var(--text-secondary)] hover:text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                {course.title}
              </Link>
            ))}
            <button className="flex items-center gap-2.5 rounded-lg px-0 py-1.5 text-left text-[13.5px] text-muted hover:text-[var(--text-secondary)]">
              <Plus size={13} />
              New course
            </button>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-panel-border px-1 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 text-[10px] font-medium text-[#0a0d1a]">
              {email ? getInitials(email) : "?"}
            </div>
            <span className="text-[13px] text-[var(--text-secondary)]">
              {email ?? "Not signed in"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[12px] text-muted hover:text-[var(--text-secondary)]"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}