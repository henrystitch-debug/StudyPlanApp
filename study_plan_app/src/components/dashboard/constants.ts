import { LayoutDashboard, BookOpen, Flame, CalendarDays, ClipboardList, BarChart2 } from "lucide-react";
import type { NavItem, TodoItem, CoursePlan } from "./types";

// TODO: "Analytics" hat noch keine eigene Seite – Link zeigt vorerst auf "#"
// (Sidebar behandelt das als deaktiviert), bis die Seite existiert.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Flashcards", icon: BookOpen, href: "/study" },
  { label: "Streak", icon: Flame, href: "/streak" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Courses", icon: ClipboardList, href: "/subjects" },
  { label: "Analytics", icon: BarChart2, href: "#" },
];

export const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export const INITIAL_TODOS: TodoItem[] = [
  { id: "t1", label: "Review color theory notes", done: true },
  { id: "t2", label: "Sketch 3 thumbnail studies", done: false },
  { id: "t3", label: "Read chapter on composition", done: false },
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

export const DEFAULT_WIDGET_IDS = ["focus", "subjects", "todo", "review", "week", "analytics"];