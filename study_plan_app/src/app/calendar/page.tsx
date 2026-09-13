"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarEvent, EventType, RawEvent } from "@/types/calendar";
import { Course } from "@/types/course";


const userId = 27; //TODO: Replace later

function toCalendarEvent(e: RawEvent): CalendarEvent {
  return {
    id: e.event_id,
    date: new Date(e.event_date),
    title: e.description,
    startTime: e.start_time,
    endTime: e.end_time,
    type: e.event_type,
    courseId: e.course_id,
  };
}

const TYPE_META: Record<EventType, { label: string; dotClass: string }> = {
  lecture: { label: "Lectures", dotClass: "bg-accent" },
  exam: { label: "Exams", dotClass: "bg-rose" },
  study_session: { label: "Study sessions", dotClass: "bg-emerald-400" },
  other: { label: "Other", dotClass: "bg-[var(--text-secondary)]" },
};

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

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [activeTypes, setActiveTypes] = useState<EventType[]>([
    "lecture",
    "exam",
    "study_session",
    "other",
  ]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseIds, setActiveCourseIds] = useState<number[]>([]); // empty = all courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const eventsUrl = new URL("http://localhost:3000/api/calendar/eventsAll");
        eventsUrl.searchParams.set("userId", `${userId}`);
        const eventsRes = await fetch(eventsUrl);
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const eventsData = await eventsRes.json();
        const rawEvents: RawEvent[] = eventsData.events ?? eventsData;
        const mappedEvents = rawEvents.map(toCalendarEvent);
        setAllEvents(mappedEvents);


        const coursesUrl = new URL("http://localhost:3000/api/course/coursesAll");
        coursesUrl.searchParams.set("userId", `${userId}`);
        const coursesRes = await fetch(coursesUrl);
        if (!coursesRes.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesRes.json();
        const coursesList = coursesData.courses ?? coursesData;
        setCourses(coursesList);

      } catch (err) {
        console.error(err);
        setError("Could not load your calendar.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
        const matchesType = activeTypes.includes(e.type);
        const matchesCourse =
          activeCourseIds.length === 0 ||
          e.courseId === null ||
          activeCourseIds.includes(e.courseId);
        const matchesMonth =
          e.date.getFullYear() === year && e.date.getMonth() === monthIndex;
        return matchesType && matchesCourse && matchesMonth;
      }),
    [allEvents, activeTypes, activeCourseIds, year, monthIndex]
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

  const toggleCourse = (courseId: number) => {
    setActiveCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const eventsForSelectedDay = selectedDay
    ? visibleEvents.filter((e) => e.date.getDate() === selectedDay)
    : [];

  if (loading) {
    return <p className="text-[13px] text-muted">Loading calendar...</p>;
  }

  if (error) {
    return <p className="text-[13px] text-[var(--text-danger)]">{error}</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
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

      {courses.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted self-center">
            Courses
          </span>
          {courses.map((course) => {
            const isSelected = activeCourseIds.includes(course.course_id);
            return (
              <button
                key={course.course_id}
                onClick={() => toggleCourse(course.course_id)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                  isSelected
                    ? "border-accent bg-[var(--overlay-strong)] text-foreground"
                    : "border-panel-border text-muted opacity-50"
                }`}
              >
                {course.title}
              </button>
            );
          })}
        </div>
      )}

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
          const dayEvents = visibleEvents.filter((e) => e.date.getDate() === day);
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
                {e.startTime && e.endTime && (
                  <span className="text-[11px] text-muted">
                    {e.startTime} – {e.endTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}