import { LayoutDashboard, BookOpen, Flame, CalendarDays, ClipboardList, ListChecks, BarChart2 } from "lucide-react";
import type { NavItem, TodoItem, CoursePlan } from "./types";

// TODO: "Analytics" hat noch keine eigene Seite – Link zeigt vorerst auf "#"
// (Sidebar behandelt das als deaktiviert), bis die Seite existiert.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Quizzes", icon: BookOpen, href: "/quizzes" },
  { label: "Streak", icon: Flame, href: "/streak" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Courses", icon: ClipboardList, href: "/courses" },
  { label: "To-do", icon: ListChecks, href: "/todos" },
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
  "from-rose-200 via-rose-300 to-rose-500/40",
  "from-sky-200 via-sky-300 to-sky-500/40",
  "from-emerald-200 via-emerald-300 to-emerald-500/40",
  "from-amber-200 via-amber-300 to-amber-500/40",
  "from-violet-200 via-violet-300 to-violet-500/40",
  "from-pink-200 via-pink-300 to-pink-500/40",
  "from-cyan-200 via-cyan-300 to-cyan-500/40",
  "from-lime-200 via-lime-300 to-lime-500/40",
];

export function gradientForCourse(courseId: number) {
  return GRADIENTS[courseId % GRADIENTS.length];
}

export const DEFAULT_WIDGET_IDS = ["focus", "courses", "todo", "review", "week", "analytics"];
