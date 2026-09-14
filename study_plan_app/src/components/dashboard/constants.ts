import { LayoutDashboard, BookOpen, Flame, CalendarDays, ClipboardList, ListChecks, BarChart2 } from "lucide-react";
import type { NavItem, TodoItem, CoursePlan } from "./types";

// TODO: "Analytics" hat noch keine eigene Seite – Link zeigt vorerst auf "#"
// (Sidebar behandelt das als deaktiviert), bis die Seite existiert.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "To Do", icon: ListChecks, href: "/todo" },
  { label: "Flashcards", icon: BookOpen, href: "/study" },
  { label: "Streak", icon: Flame, href: "/streak" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Courses", icon: ClipboardList, href: "/courses" },
  { label: "Analytics", icon: BarChart2, href: "#" },
];

export const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export const INITIAL_TODOS: TodoItem[] = [
  { id: 1, label: "Review color theory notes", done: true },
  { id: 2, label: "Sketch 3 thumbnail studies", done: false },
  { id: 3, label: "Read chapter on composition", done: false },
];

export const INITIAL_COURSE_PLANS: CoursePlan[] = [
  {
    id: "c1",
    course: "art",
    color: "bg-rose",
    items: [
      { id: "p1", task: "Color theory basics", done: true },
      { id: "p2", task: "Portfolio review", done: false },
      { id: "p3", task: "Life drawing practice", done: false },
    ],
  },
];

export const GRADIENTS = [
  "from-rose via-rose-500 to-[#2a1030]",
  "from-sky-400 via-sky-600 to-[#0a1a2a]",
  "from-emerald-400 via-emerald-600 to-[#0a2a1a]",
  "from-amber-400 via-amber-600 to-[#2a1f0a]",
  "from-violet-400 via-violet-600 to-[#1f0a2a]",
  "from-pink-400 via-pink-600 to-[#2a0a1f]",
  "from-cyan-400 via-cyan-600 to-[#0a2a2a]",
  "from-lime-400 via-lime-600 to-[#1a2a0a]",
];

export function gradientForCourse(courseId: number) {
  return GRADIENTS[courseId % GRADIENTS.length];
}

export const DEFAULT_WIDGET_IDS = ["focus", "courses", "todo", "review", "week", "analytics", "weather", "time"];
