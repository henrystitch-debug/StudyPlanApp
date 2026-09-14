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
  Pencil,
  Plus,
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

function toDateInputValue(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Rounds up to the next half hour and gives a 1h duration, capped so it
// doesn't spill past the end of the day — a friendlier default than a
// fixed 09:00–10:00 regardless of when you're actually adding the event.
function defaultEventTimes(now: Date) {
  let hour = now.getHours();
  const minute = now.getMinutes() < 30 ? 30 : 0;
  if (minute === 0) hour += 1;
  hour = Math.min(hour, 22);
  const endHour = Math.min(hour + 1, 23);

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startTime: `${pad(hour)}:${pad(minute)}`,
    endTime: `${pad(endHour)}:${pad(minute)}`,
  };
}

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
  onClick,
}: {
  event: CalendarEvent;
  course?: Course;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg border border-panel-border bg-[var(--sunken)] px-3 py-2.5 text-left transition-colors ${
        onClick ? "hover:border-accent/50 hover:bg-[var(--overlay)]" : ""
      }`}
    >
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
      {onClick && <Pencil size={12} className="shrink-0 text-muted" />}
    </Wrapper>
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "lecture" as EventType,
    courseId: null as number | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  const closeEventModal = () => {
    setShowAddModal(false);
    setEditingEventId(null);
  };

  const openAddModal = (day?: number) => {
    const targetDay = day ?? (isCurrentMonth ? today.getDate() : 1);
    setAddForm({
      title: "",
      date: toDateInputValue(year, monthIndex, targetDay),
      ...defaultEventTimes(new Date()),
      type: "lecture",
      courseId: null,
    });
    setAddError(null);
    setEditingEventId(null);
    setSelectedDay(null);
    setShowAddModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setAddForm({
      title: event.title,
      date: toDateInputValue(
        event.date.getFullYear(),
        event.date.getMonth(),
        event.date.getDate()
      ),
      startTime: event.startTime ?? "09:00",
      endTime: event.endTime ?? "10:00",
      type: event.type,
      courseId: event.courseId,
    });
    setAddError(null);
    setEditingEventId(event.id);
    setSelectedDay(null);
    setShowAddModal(true);
  };

  const validateEventForm = () => {
    if (!addForm.title.trim()) {
      setAddError("Title is required.");
      return false;
    }
    if (!addForm.date || !addForm.startTime || !addForm.endTime) {
      setAddError("Date, start time and end time are required.");
      return false;
    }
    if (addForm.endTime <= addForm.startTime) {
      setAddError("End time must be after start time.");
      return false;
    }
    return true;
  };

  const handleSaveEvent = async () => {
    if (!userId) return;
    if (!validateEventForm()) return;

    setIsSaving(true);
    setAddError(null);
    try {
      const isEditing = editingEventId !== null;
      const res = await fetch(
        isEditing ? "/api/calendar/eventEdit" : "/api/calendar/eventCreate",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isEditing ? { eventId: editingEventId } : { userId }),
            eventDate: addForm.date,
            startTime: addForm.startTime,
            endTime: addForm.endTime,
            eventType: addForm.type,
            description: addForm.title.trim(),
            courseId: addForm.courseId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? `Could not ${isEditing ? "update" : "create"} event`);

      const saved = toCalendarEvent(data.event);
      setAllEvents((prev) =>
        isEditing ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved]
      );
      closeEventModal();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (editingEventId === null) return;
    setIsSaving(true);
    setAddError(null);
    try {
      const res = await fetch(
        `/api/calendar/eventDelete?eventId=${editingEventId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete event");

      setAllEvents((prev) => prev.filter((e) => e.id !== editingEventId));
      closeEventModal();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
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

  // Day details / add-event open in a modal — close on Escape, lock background scroll.
  useEffect(() => {
    if (selectedDay === null && !showAddModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDay(null);
        closeEventModal();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedDay, showAddModal]);

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
          <button
            type="button"
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition-colors hover:brightness-110"
          >
            <Plus size={14} />
            Add event
          </button>

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
                        <EventRow
                          key={e.id}
                          event={e}
                          course={e.courseId ? coursesById.get(e.courseId) : undefined}
                          onClick={() => openEditModal(e)}
                        />
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
            className="relative z-10 flex w-full max-w-xl max-h-[85vh] flex-col rounded-2xl border border-panel-border bg-panel p-6 shadow-xl"
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
              <div className="-mr-1 -mt-1 flex items-center gap-0.5">
                <button
                  onClick={() => openAddModal(selectedDay ?? undefined)}
                  aria-label="Add event on this day"
                  title="Add event"
                  className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] hover:text-foreground"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setSelectedDay(null)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {eventsForSelectedDay.length === 0 ? (
              anyFilter ? (
                <p className="text-[13px] text-muted">
                  No events match the current filters.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddModal(selectedDay ?? undefined)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-panel-border py-4 text-[13px] text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                >
                  <Plus size={14} />
                  Add an event for this day
                </button>
              )
            ) : (
              <div className="mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {eventsForSelectedDay.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    course={e.courseId ? coursesById.get(e.courseId) : undefined}
                    onClick={() => openEditModal(e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingEventId !== null ? "Edit event" : "Add event"}
          onClick={closeEventModal}
        >
          <div className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm" />
          <div
            className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-y-auto rounded-2xl border border-panel-border bg-panel p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-medium text-foreground font-serif">
                  {editingEventId !== null ? "Edit event" : "Add event"}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {editingEventId !== null
                    ? "Update the details or delete this event."
                    : "Create a lecture, exam, or study session."}
                </p>
              </div>
              <button
                onClick={closeEventModal}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Title
                </label>
                <input
                  autoFocus
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, title: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEvent()}
                  placeholder="e.g. Linear Algebra midterm"
                  className="w-full rounded-md border border-panel-border bg-[var(--sunken)] px-3 py-2 text-[13.5px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Type / tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddForm((f) => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                        addForm.type === t
                          ? "border-accent bg-[var(--overlay-strong)] text-foreground"
                          : "border-panel-border text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${TYPE_META[t].dotClass}`}
                      />
                      {TYPE_META[t].singular}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                    Date
                  </label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                    Start
                  </label>
                  <input
                    type="time"
                    value={addForm.startTime}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="w-full rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                    End
                  </label>
                  <input
                    type="time"
                    value={addForm.endTime}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                    className="w-full rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {courses.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted">
                    Course (optional)
                  </label>
                  <select
                    value={addForm.courseId ?? ""}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        courseId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">No course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {addError && (
                <p className="text-[12px] text-rose">{addError}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              {editingEventId !== null && (
                <button
                  onClick={handleDeleteEvent}
                  disabled={isSaving}
                  className="mr-auto rounded-md px-3 py-1.5 text-[12.5px] text-rose transition-colors hover:bg-rose/10 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <button
                onClick={closeEventModal}
                className="rounded-md px-3 py-1.5 text-[12.5px] text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={isSaving || !addForm.title.trim()}
                className="rounded-md bg-accent px-4 py-1.5 text-[12.5px] font-medium text-accent-foreground transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {isSaving ? "Saving…" : editingEventId !== null ? "Save changes" : "Add event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}