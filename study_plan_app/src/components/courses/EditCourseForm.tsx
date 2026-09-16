import { Course } from "@/types/course";
import { useState } from "react";

export function EditCourseForm({
  course,
  existingSemesters,
  onSaved,
  onCancel,
}: {
  course: Course;
  existingSemesters: string[];
  onSaved: (course: Course) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(course.title);
  const [semester, setSemester] = useState(course.semester ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/course/courseUpdate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          title,
          semester,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Kurs konnte nicht gespeichert werden");
      }

      onSaved({
        courseId: data.course.course_id,
        title: data.course.title,
        semester: data.course.semester,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-panel-border bg-panel p-3.5">
      <input
        autoFocus
        placeholder="Course name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <input
        list="edit-semester-options"
        placeholder="Semester (optional)"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <datalist id="edit-semester-options">
        {existingSemesters.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {error && <p className="text-[11px] text-rose">{error}</p>}
      <div className="mt-1 flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="flex-1 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1.5 text-[12.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-2.5 py-1.5 text-[12.5px] text-muted hover:text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}