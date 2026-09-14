"use client";

import { useAuth } from "@/hooks/useAuth";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CourseWithCount = {
  id: number;
  name: string;
  uploadCount: number;
  lastUploadedAt: string | null;
};

type RawCourse = {
  course_id: number;
  title: string;
  upload_count: string; // Postgres COUNT() comes back as a string
  last_uploaded_at: string | null;
};

const GRADIENTS = [
  "from-rose via-rose-500 to-[#2a1030]",
  "from-sky-400 via-sky-600 to-[#0a1a2a]",
  "from-emerald-400 via-emerald-600 to-[#0a2a1a]",
  "from-amber-400 via-amber-600 to-[#2a1f0a]",
  "from-violet-400 via-violet-600 to-[#1f0a2a]",
];

export function CoursesWidget() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();

  const [courses, setCourses] = useState<CourseWithCount[]>([]);
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
            id: c.course_id,
            name: c.title,
            uploadCount: Number(c.upload_count),
            lastUploadedAt: c.last_uploaded_at,
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

  return (
    <div className="col-span-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold text-foreground font-serif">Your Courses</h3>
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
        <p className="text-[13px] text-muted">No courses yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {courses.map((course, i) => (
            <button
              key={course.id}
              onClick={() => router.push(`/courses?courseId=${course.id}`)}
              className="overflow-hidden rounded-xl border border-panel-border bg-panel text-left transition-colors hover:border-[var(--overlay-strong)]"
            >
              <div className={`h-20 w-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />
              <div className="p-3">
                <p className="text-[14.5px] capitalize text-foreground">{course.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {course.uploadCount} document{course.uploadCount === 1 ? "" : "s"}
                  {course.lastUploadedAt &&
                    ` · edited ${new Date(course.lastUploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}