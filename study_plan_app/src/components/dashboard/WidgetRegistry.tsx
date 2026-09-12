import type { WidgetDef } from "./types";
import { FocusCard } from "./FocusCard";
import { TodoWidget } from "./TodoWidget";
import { StudyPlanWidget } from "./StudyPlanWidget";
import { AnalyticsWidget } from "./AnalyticsWidget";
import { ReviewWidget } from "./ReviewWidget";
import { WeekWidget } from "./WeekWidget";

// Subject browsing already has a proper home at /subjects (and the "Courses"
// sidebar link) — the dashboard only needs the daily-focus widgets below.
export const WIDGET_REGISTRY: WidgetDef[] = [
  {
    id: "focus",
    label: "Focus Session",
    description: "A 25-minute pomodoro timer for deep work.",
    span: "grid",
    render: () => <FocusCard />,
  },
  {
    id: "todo",
    label: "To Do",
    description: "A quick checklist for today.",
    span: "grid",
    render: () => <TodoWidget />,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Per-course progress, open to check off items.",
    span: "grid",
    render: () => <AnalyticsWidget />,
  },
  {
    id: "review",
    label: "Due for Review",
    description: "Flashcards that need another pass.",
    span: "grid",
    render: () => <ReviewWidget />,
  },
  {
    id: "week",
    label: "This Week",
    description: "Hours studied and focus sessions logged.",
    span: "grid",
    render: () => <WeekWidget />,
  },
  {
    id: "studyplan",
    label: "Study Plan",
    description: "Your courses, open to check off tasks.",
    span: "grid",
    render: () => <StudyPlanWidget />,
  },
];
