"use client";
import { useMemo, useState } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme, ThemeToggle, Sidebar } from "../shared-shell";

type EventType = "event" | "task" | "holiday" | "reminder";

type CalendarEvent = {
  id: string;
  day: number; // Tag im Monat, 1-31
  title: string;
  time?: string;
  type: EventType;
};

// TODO: Platzhalter-Termine – später aus der Datenbank laden
// (z.B. StudyPlanItem + eigene Events/Reminders), statt hart codiert.
const MOCK_EVENTS: CalendarEvent[] = [
  { id: "e1", day: 3, title: "Salsa Course", time: "7 pm", type: "event" },
  { id: "e2", day: 8, title: "Statistics Exam", type: "task" },
  { id: "e3", day: 12, title: "Public Holiday", type: "holiday" },
  { id: "e4", day: 18, title: "Submit essay draft", type: "reminder" },
  { id: "e5", day: 21, title: "Study group", time: "5 pm", type: "event" },
];

const TYPE_META: Record<EventType, { label: string; dotClass: string }> = {
  event: { label: "Events", dotClass: "bg-accent" },
  task: { label: "Tasks", dotClass: "bg-rose" },
  holiday: { label: "Holidays", dotClass: "bg-emerald-400" },
  reminder: { label: "Reminders", dotClass: "bg-[var(--text-secondary)]" },
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // JS: 0 = Sonntag ... wir wollen Montag als ersten Wochentag
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [activeTypes, setActiveTypes] = useState<EventType[]>([
    "event",
    "task",
    "holiday",
    "reminder",
  ]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const cells = useMemo(
    () => getMonthGrid(year, monthIndex),
    [year, monthIndex]
  );

  const monthLabel = new Date(year, monthIndex).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const visibleEvents = MOCK_EVENTS.filter((e) =>
    activeTypes.includes(e.type)
  );

  const goToMonth = (delta: number) => {
    const newDate = new Date(year, monthIndex + delta, 1);
    setYear(newDate.getFullYear());
    setMonthIndex(newDate.getMonth());
    setSelectedDay(null);
  };

  const toggleType = (type: EventType) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const eventsForSelectedDay = selectedDay
    ? visibleEvents.filter((e) => e.day === selectedDay)
    : [];

  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToMonth(-1)}
                className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)]"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <h1 className="text-[22px] font-medium tracking-tight text-foreground font-serif sm:text-[26px]">
                {monthLabel}
              </h1>
              <button
                onClick={() => goToMonth(1)}
                className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)]"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {(Object.keys(TYPE_META) as EventType[]).map((type) => {
                const meta = TYPE_META[type];
                const active = activeTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                      active
                        ? "border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)]"
                        : "border-panel-border text-muted opacity-50"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[11px] uppercase tracking-wider text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="aspect-square" />;
              }
              const dayEvents = visibleEvents.filter((e) => e.day === day);
              const isToday =
                day === today.getDate() &&
                monthIndex === today.getMonth() &&
                year === today.getFullYear();
              const isSelected = day === selectedDay;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`flex aspect-square flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-[var(--overlay-strong)]"
                      : "border-panel-border bg-panel hover:bg-[var(--overlay)]"
                  }`}
                >
                  <span
                    className={`text-[12px] ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`h-1.5 w-1.5 rounded-full ${TYPE_META[e.type].dotClass}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <section className="mt-8 rounded-2xl border border-panel-border bg-panel p-5">
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              {selectedDay
                ? `${monthLabel.split(" ")[0]} ${selectedDay}`
                : "Select a day"}
            </h2>
            {selectedDay === null ? (
              <p className="text-[13px] text-muted">
                Click a date to see what&apos;s on.
              </p>
            ) : eventsForSelectedDay.length === 0 ? (
              <p className="text-[13px] text-muted">Nothing scheduled.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {eventsForSelectedDay.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2.5 rounded-lg border border-panel-border bg-[var(--sunken)] px-3 py-2"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${TYPE_META[e.type].dotClass}`}
                    />
                    <span className="flex-1 text-[13px] text-[var(--text-secondary)]">
                      {e.title}
                    </span>
                    {e.time && (
                      <span className="text-[11px] text-muted">{e.time}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
