"use client";

import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { gradientForCourse } from "./constants";

type CourseWithProgress = {
  courseId: number;
  title: string;
  semester: string;
  uploadCount: number;
  lastUploadedAt: string | null;
  itemCount: number;
  completedItemCount: number;
};

type RawCourse = {
  course_id: number;
  title: string;
  semester: string | null;
  upload_count: string; // Postgres COUNT() comes back as a string
  last_uploaded_at: string | null;
  item_count: string;
  completed_item_count: string;
};

const VISIBLE_LIMIT = 5;

export function CoursesWidget() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();

  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed === false) router.replace("/login");
  }, [isAuthed, router]);

  useEffect(() => {
    if (!userId) return;

    async function fetchCourses() {
      try {
        const url = new URL("/api/course/coursesWithCounts", window.location.origin);
        url.searchParams.set("userId", `${userId}`);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const rawCourses: RawCourse[] = data.courses ?? [];
        setCourses(
          rawCourses.map((c) => ({
            courseId: c.course_id,
            title: c.title,
            semester: c.semester ?? "",
            uploadCount: Number(c.upload_count),
            lastUploadedAt: c.last_uploaded_at,
            itemCount: Number(c.item_count),
            completedItemCount: Number(c.completed_item_count),
          }))
        );
      } catch (err) {
        console.error("Failed to load courses:", err);
        setError("Could not load your courses.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [userId]);

  const visibleCourses = courses.slice(0, VISIBLE_LIMIT);
  const hiddenCount = courses.length - visibleCourses.length;

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-foreground font-serif">Your Courses</h3>
          {!loading && !error && courses.length > 0 && (
            <p className="mt-0.5 text-[12px] text-muted">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/courses")}
          className="flex items-center gap-1 text-[13.5px] text-muted hover:text-[var(--text-secondary)]"
        >
          All Courses <ChevronRight size={13} />
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">Loading courses...</p>
      ) : error ? (
        <p className="text-[13px] text-rose">{error}</p>
      ) : courses.length === 0 ? (
        <p className="text-[13px] text-muted">
          No courses yet. Head to{" "}
          <button
            onClick={() => router.push("/courses")}
            className="text-accent hover:underline"
          >
            Courses
          </button>{" "}
          to add one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleCourses.map((course) => {
            const hasPlan = course.itemCount > 0;
            const percent = hasPlan
              ? Math.round((course.completedItemCount / course.itemCount) * 100)
              : 0;

            return (
              <button
                key={course.courseId}
                onClick={() => router.push(`/courses?courseId=${course.courseId}`)}
                className="group flex items-center gap-4 rounded-xl border border-panel-border bg-panel p-3 text-left transition-colors hover:border-accent/40 hover:bg-[var(--overlay)]"
              >
                <span
                  className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${gradientForCourse(
                    course.courseId
                  )}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="truncate text-[14.5px] font-medium capitalize text-foreground">
                      {course.title}
                    </p>
                    {course.semester && (
                      <span className="shrink-0 rounded-full bg-[var(--overlay)] px-2 py-0.5 text-[10.5px] text-muted">
                        {course.semester}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                    <FileText size={11} className="shrink-0" />
                    {course.uploadCount} document{course.uploadCount === 1 ? "" : "s"}
                    {course.lastUploadedAt &&
                      ` · edited ${new Date(course.lastUploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`}
                  </p>

                  {hasPlan ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--overlay)]">
                        <div
                          className="h-full rounded-full bg-accent transition-[width]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted">
                        {course.completedItemCount}/{course.itemCount} · {percent}%
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] italic text-muted">No study plan yet</p>
                  )}
                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-muted transition-colors group-hover:text-foreground"
                />
              </button>
            );
          })}

          {hiddenCount > 0 && (
            <button
              onClick={() => router.push("/courses")}
              className="mt-1 self-center text-[12px] text-muted hover:text-[var(--text-secondary)]"
            >
              +{hiddenCount} more course{hiddenCount === 1 ? "" : "s"} · View all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
