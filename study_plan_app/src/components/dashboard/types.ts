import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type Theme = "dark" | "light";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type TodoItem = {
  id: string;
  label: string;
  done: boolean;
};

export type PlanItem = {
  id: string;
  task: string;
  done: boolean;
};

export type CoursePlan = {
  id: string;
  course: string;
  color: string;
  items: PlanItem[];
};

export type WidgetDef = {
  id: string;
  label: string;
  description: string;
  span: "full" | "grid";
  render: () => ReactNode;
};
