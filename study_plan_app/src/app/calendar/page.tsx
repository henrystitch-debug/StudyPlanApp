"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type EventType = "lecture" | "exam" | "study_session" | "other";

type CalendarEvent = {
  id: number;
  date: Date;
  title: string;
  startTime?: string;
  endTime?: string;
  type: EventType;
  courseId: number | null;
};

type RawEvent = {
  event_id: number;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  event_type: EventType;
  description: string | null;
  course_id: number | null;
};

type Course = {
  id: number;
  name: string;
  color: string; // assigned client-side — DB has no color column
};

const COURSE_COLORS = [
  "bg-accent",
  "bg-rose",
  "bg-emerald-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-violet-400",
];

function toCalendarEvent(e: RawEvent): CalendarEvent {
  return {
    id: e.event_id,
    date: new Date(e.event_date),
    title: e.description ?? e.event_type,
    startTime: e.start_time ? e.start_time.slice(0, 5) : undefined,
    endTime: e.end_time ? e.end_time.slice(0, 5) : undefined,
    type: e.event_type,
    courseId: e.course_id,
  };
}

const TYPE_META: Record<
  EventType,
  { label: string; singular: string; dotClass: string }
> = {
  lecture: { label: "Lectures", singular: "Lecture", dotClass: "bg-accent" },
  exam: { label: "Exams", singular: "Exam", dotClass: "bg-rose" },
  study_session: {
    label: "Study sessions",
    singular: "Study session",
    dotClass: "bg-emerald-400",
  },
  other: { label: "Other", singular: "Other", dotClass: "bg-[var(--text-secondary)]" },
};

const ALL_TYPES = Object.keys(TYPE_META) as EventType[];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// "09:00" / "14:30" -> minutes since midnight; untimed sorts last.
function timeToMinutes(time?: string): number {
  if (!time) return 24 * 60 + 1;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

const byTime = (a: CalendarEvent, b: CalendarEvent) =>
  timeToMinutes(a.startTime) - timeToMinutes(b.startTime);

// --- filter dropdown -------------------------------------------------------

function FilterDropdown({
  label,
  activeCount,
  children,
}: {
  label: string;
  activeCount: number; // how many options are switched off (0 = not filtered)
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
          activeCount > 0
            ? "border-accent/50 bg-[var(--overlay)] text-foreground"
            : "border-panel-border bg-[var(--overlay)] text-[var(--text-secondary)] hover:bg-[var(--overlay-strong)]"
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-[10px] font-medium text-accent-foreground">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-panel-border bg-panel p-1.5 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  dotClass,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  dotClass?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)]"
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          checked
            ? "border-accent bg-accent text-accent-foreground"
            : "border-panel-border"
        }`}
      >
        {checked && <Check size={10} strokeWidth={3} />}
      </span>
      {dotClass && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />}
      <span className="flex-1 truncate text-left">{children}</span>
    </button>
  );
}

function MenuHeader({
  title,
  onAll,
  onNone,
}: {
  title: string;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between px-2.5 pt-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted">
        {title}
      </span>
      <span className="flex gap-1.5 text-[11px]">
        <button type="button" onClick={onAll} className="text-muted hover:text-foreground">
          All
        </button>
        <span className="text-panel-border">·</span>
        <button type="button" onClick={onNone} className="text-muted hover:text-foreground">
          None
        </button>
      </span>
    </div>
  );
}

// --- shared event row (popup + agenda) -----------------------------------

function EventRow({
  event,
  course,
}: {
  event: CalendarEvent;
  course?: Course;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-panel-border bg-[var(--sunken)] px-3 py-2.5">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${TYPE_META[event.type].dotClass}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] text-[var(--text-secondary)]">
          {event.title}
        </span>
        <span className="text-[10.5px] uppercase tracking-wide text-muted">
          {TYPE_META[event.type].singular}
        </span>
      </div>
      {course && (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--overlay)] px-2 py-0.5 text-[10.5px] text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${course.color}`} />
          {course.name}
        </span>
      )}
      {event.startTime && event.endTime && (
        <span className="shrink-0 text-[11px] text-muted">
          {event.startTime} – {event.endTime}
        </span>
      )}
    </div>
  );
}

// --- page ----------------------------------------------------------------

export default function CalendarPage() {
  const { userId } = useAuth();
  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");

  // Filters store what's switched OFF, so a freshly added course / a new event
  // type shows up by default without any reconciliation.
  const [hiddenTypes, setHiddenTypes] = useState<EventType[]>([]);
  const [hiddenCourseIds, setHiddenCourseIds] = useState<number[]>([]);

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();

  const isCurrentMonth =
    year === today.getFullYear() && monthIndex === today.getMonth();

  const coursesById = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  );

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      try {
        setLoading(true);

        const eventsUrl = new URL("/api/calendar/eventsAll", window.location.origin);
        eventsUrl.searchParams.set("userId", `${userId}`);
        const eventsRes = await fetch(eventsUrl);
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const eventsData = await eventsRes.json();
        const rawEvents: RawEvent[] = eventsData.events ?? eventsData;
        setAllEvents(rawEvents.map(toCalendarEvent));

        // TODO: confirm this matches your real course route's response shape
        const coursesUrl = new URL("/api/course/coursesAll", window.location.origin);
        coursesUrl.searchParams.set("userId", `${userId}`);
        const coursesRes = await fetch(coursesUrl);
        if (!coursesRes.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesRes.json();
        const rawCourses: { course_id: number; title: string }[] =
          coursesData.courses ?? coursesData;
        setCourses(
          rawCourses.map((c, i) => ({
            id: c.course_id,
            name: c.title,
            color: COURSE_COLORS[i % COURSE_COLORS.length],
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Could not load your calendar.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const cells = useMemo(
    () => getMonthGrid(year, monthIndex),
    [year, monthIndex]
  );

  const monthLabel = new Date(year, monthIndex).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const visibleEvents = useMemo(
    () =>
      allEvents.filter((e) => {
        const matchesType = !hiddenTypes.includes(e.type);
        const matchesCourse =
          e.courseId === null || !hiddenCourseIds.includes(e.courseId);
        const matchesMonth =
          e.date.getFullYear() === year && e.date.getMonth() === monthIndex;
        return matchesType && matchesCourse && matchesMonth;
      }),
    [allEvents, hiddenTypes, hiddenCourseIds, year, monthIndex]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of visibleEvents) {
      const day = e.date.getDate();
      const list = map.get(day) ?? [];
      list.push(e);
      map.set(day, list);
    }
    for (const list of map.values()) list.sort(byTime);
    return map;
  }, [visibleEvents]);

  const goToMonth = useCallback((delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  }, [today]);

  const clearFilters = () => {
    setHiddenTypes([]);
    setHiddenCourseIds([]);
  };

  const toggleHidden = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    value: T
  ) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  // Keyboard: ←/→ change month, T jumps to today. Skipped while the popup is
  // open or a form field is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (selectedDay !== null) return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToMonth(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToMonth(1);
      } else if (e.key === "t" || e.key === "T") {
        goToToday();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDay, goToMonth, goToToday]);

  const eventsForSelectedDay =
    selectedDay !== null ? eventsByDay.get(selectedDay) ?? [] : [];

  // Day details open in a modal — close on Escape, lock background scroll.
  useEffect(() => {
    if (selectedDay === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedDay(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedDay]);

  const selectedDayLabel =
    selectedDay !== null
      ? new Date(year, monthIndex, selectedDay).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "";

  const shownTypes = ALL_TYPES.filter((t) => !hiddenTypes.includes(t));
  const shownCourses = courses.filter((c) => !hiddenCourseIds.includes(c.id));
  const anyFilter = hiddenTypes.length > 0 || hiddenCourseIds.length > 0;

  const agendaDays = useMemo(
    () => [...eventsByDay.keys()].filter((d) => d >= 1).sort((a, b) => a - b),
    [eventsByDay]
  );

  if (loading) {
    return <p className="text-[13px] text-muted">Loading calendar...</p>;
  }

  if (error) {
    return <p className="text-[13px] text-[var(--text-danger)]">{error}</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToMonth(-1)}
            className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)]"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="min-w-[150px] text-center text-[22px] font-medium tracking-tight text-foreground font-serif sm:text-[26px]">
            {monthLabel}
          </h1>
          <button
            onClick={() => goToMonth(1)}
            className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)]"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToToday}
            disabled={isCurrentMonth && selectedDay === null}
            className="ml-1 rounded-full border border-panel-border px-3 py-1 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)] disabled:cursor-default disabled:opacity-40"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-panel-border p-0.5 text-[12px]">
            {(["month", "agenda"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 capitalize transition-colors ${
                  view === v
                    ? "bg-[var(--overlay-strong)] text-foreground"
                    : "text-muted hover:text-[var(--text-secondary)]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <FilterDropdown label="Type" activeCount={hiddenTypes.length}>
            <MenuHeader
              title="Show types"
              onAll={() => setHiddenTypes([])}
              onNone={() => setHiddenTypes([...ALL_TYPES])}
            />
            {ALL_TYPES.map((type) => (
              <CheckRow
                key={type}
                checked={!hiddenTypes.includes(type)}
                onToggle={() => toggleHidden(setHiddenTypes, type)}
                dotClass={TYPE_META[type].dotClass}
              >
                {TYPE_META[type].label}
              </CheckRow>
            ))}
          </FilterDropdown>

          <FilterDropdown label="Courses" activeCount={hiddenCourseIds.length}>
            <MenuHeader
              title="Show courses"
              onAll={() => setHiddenCourseIds([])}
              onNone={() => setHiddenCourseIds(courses.map((c) => c.id))}
            />
            {courses.length === 0 ? (
              <p className="px-2.5 py-2 text-[12px] text-muted">
                No courses yet. Add one on the Courses page.
              </p>
            ) : (
              courses.map((course) => (
                <CheckRow
                  key={course.id}
                  checked={!hiddenCourseIds.includes(course.id)}
                  onToggle={() => toggleHidden(setHiddenCourseIds, course.id)}
                  dotClass={course.color}
                >
                  {course.name}
                </CheckRow>
              ))
            )}
          </FilterDropdown>
        </div>
      </div>

      {anyFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
          <span>Showing</span>
          {hiddenTypes.length > 0 && (
            <span className="text-[var(--text-secondary)]">
              {shownTypes.length
                ? shownTypes.map((t) => TYPE_META[t].label).join(", ")
                : "no types"}
            </span>
          )}
          {hiddenTypes.length > 0 && hiddenCourseIds.length > 0 && <span>·</span>}
          {hiddenCourseIds.length > 0 && (
            <span className="text-[var(--text-secondary)]">
              {shownCourses.length
                ? shownCourses.map((c) => c.name).join(", ")
                : "no courses"}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="rounded-full border border-panel-border px-2 py-0.5 transition-colors hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      )}

      {view === "month" ? (
        <>
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
              const isWeekend = idx % 7 >= 5;
              if (day === null) {
                return (
                  <div
                    key={idx}
                    className={`min-h-[76px] rounded-lg sm:min-h-[104px] ${
                      isWeekend ? "bg-[var(--overlay)]/40" : ""
                    }`}
                  />
                );
              }
              const dayEvents = eventsByDay.get(day) ?? [];
              const isToday =
                day === today.getDate() &&
                monthIndex === today.getMonth() &&
                year === today.getFullYear();
              const isSelected = day === selectedDay;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-[76px] flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-[104px] ${
                    isSelected
                      ? "border-accent bg-[var(--overlay-strong)]"
                      : isToday
                      ? "border-accent/40 bg-panel hover:bg-[var(--overlay)]"
                      : `border-panel-border hover:bg-[var(--overlay)] ${
                          isWeekend ? "bg-[var(--overlay)]/40" : "bg-panel"
                        }`
                  }`}
                >
                  <span
                    className={`text-[12px] ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {day}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className="flex items-center gap-1 rounded bg-[var(--overlay)] px-1 py-[1px] text-[9.5px] text-[var(--text-secondary)] sm:text-[10.5px]"
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_META[e.type].dotClass}`}
                        />
                        <span className="truncate">{e.title}</span>
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="px-1 text-[9.5px] text-muted sm:text-[10px]">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-panel-border bg-panel p-2 sm:p-4">
          {agendaDays.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted">
              {anyFilter
                ? "No events match the current filters this month."
                : "Nothing scheduled this month."}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {agendaDays.map((day) => {
                const date = new Date(year, monthIndex, day);
                const isToday =
                  day === today.getDate() &&
                  monthIndex === today.getMonth() &&
                  year === today.getFullYear();
                return (
                  <div key={day}>
                    <button
                      onClick={() => setSelectedDay(day)}
                      className="mb-1.5 flex items-baseline gap-2 px-1 text-left"
                    >
                      <span
                        className={`text-[13px] font-medium ${
                          isToday ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {date.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                        })}
                      </span>
                      {isToday && (
                        <span className="text-[10.5px] uppercase tracking-wide text-accent">
                          Today
                        </span>
                      )}
                    </button>
                    <div className="flex flex-col gap-1.5">
                      {(eventsByDay.get(day) ?? []).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedDay(day)}
                          className="text-left"
                        >
                          <EventRow
                            event={e}
                            course={e.courseId ? coursesById.get(e.courseId) : undefined}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDay !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Events on ${selectedDayLabel}`}
          onClick={() => setSelectedDay(null)}
        >
          <div className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-panel-border bg-panel p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-medium text-foreground font-serif">
                  {selectedDayLabel}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {eventsForSelectedDay.length === 0
                    ? "Nothing scheduled"
                    : `${eventsForSelectedDay.length} ${
                        eventsForSelectedDay.length === 1 ? "item" : "items"
                      }`}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {eventsForSelectedDay.length === 0 ? (
              <p className="text-[13px] text-muted">
                {anyFilter
                  ? "No events match the current filters."
                  : "Nothing scheduled for this day."}
              </p>
            ) : (
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {eventsForSelectedDay.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    course={e.courseId ? coursesById.get(e.courseId) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}