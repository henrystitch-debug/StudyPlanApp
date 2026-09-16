
import { Course } from "@/types/course";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddCourseCard({
  userId,
  existingSemesters,
  onCreated,
}: {
  userId: number;
  existingSemesters: string[];
  onCreated: (course: Course) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/course/courseCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, semester }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Kurs konnte nicht angelegt werden");
      }

      onCreated({
        courseId: data.course.course_id,
        title: data.course.title,
        semester: data.course.semester,
      });
      setTitle("");
      setSemester("");
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] text-muted transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
      >
        <Plus size={18} />
        <span className="text-[12.5px]">Add course</span>
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-[132px] flex-col gap-1.5 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] p-3">
      <input
        autoFocus
        placeholder="Course name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        className="rounded-md border border-panel-border bg-panel px-2 py-1.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <input
        list="semester-options"
        placeholder="Semester (optional)"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        className="rounded-md border border-panel-border bg-panel px-2 py-1.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <datalist id="semester-options">
        {existingSemesters.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {error && <p className="text-[11px] text-rose">{error}</p>}
      <div className="mt-auto flex gap-1.5">
        <button
          onClick={handleCreate}
          disabled={isSaving || !title.trim()}
          className="flex-1 rounded-md border border-panel-border bg-[var(--overlay)] px-2 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="rounded-md px-2 py-1 text-[11.5px] text-muted hover:text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}