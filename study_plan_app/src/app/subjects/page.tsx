"use client";
import { useState } from "react";
import { Upload, File as FileIconLucide, Trash2, Plus, X } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";

type SubjectDocument = {
  id: string;
  name: string;
  uploadedLabel: string;
};

function AddCourseCard({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] text-muted transition-colors hover:border-accent hover:text-[var(--text-secondary)]"
      >
        <Plus size={18} />
        <span className="text-[12.5px]">Add course</span>
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-[132px] flex-col justify-center gap-2 rounded-xl border border-accent bg-[var(--sunken)] p-3">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setAdding(false);
            setDraft("");
          }
        }}
        placeholder="Course name"
        className="w-full rounded-lg border border-panel-border bg-panel px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[12px] font-medium text-accent-foreground"
        >
          Add
        </button>
        <button
          onClick={() => {
            setAdding(false);
            setDraft("");
          }}
          className="rounded-lg border border-panel-border px-2 py-1.5 text-[12px] text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const { courses, addCourse, removeCourse } = useCourses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docsByCourse, setDocsByCourse] = useState<
    Record<string, SubjectDocument[]>
  >({});

  const selectedCourse = courses.find((c) => c.id === selectedId) ?? null;
  const documents = selectedId ? docsByCourse[selectedId] ?? [] : [];

  const handleFileUpload = (file: File) => {
    if (!selectedId) return;
    // TODO: Datei tatsächlich hochladen (z.B. an app/api/upload), dort Text
    // extrahieren und als Document-Eintrag in der Datenbank speichern.
    setDocsByCourse((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] ?? []),
        { id: `${Date.now()}`, name: file.name, uploadedLabel: "just now" },
      ],
    }));
  };

  const handleRemove = (id: string) => {
    if (!selectedId) return;
    setDocsByCourse((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? []).filter((d) => d.id !== id),
    }));
  };

  const handleRemoveCourse = (id: string) => {
    removeCourse(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <>
      <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        Your Courses
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {courses.map((course) => {
          const isSelected = course.id === selectedId;
          const count = (docsByCourse[course.id] ?? []).length;
          return (
            <div
              key={course.id}
              className={`group relative overflow-hidden rounded-xl border bg-panel text-left transition-colors ${
                isSelected
                  ? "border-accent"
                  : "border-panel-border hover:border-[var(--overlay-strong)]"
              }`}
            >
              <button
                onClick={() => setSelectedId(isSelected ? null : course.id)}
                className="block w-full text-left"
              >
                <div className={`h-20 w-full ${course.color}`} />
                <div className="p-3">
                  <p className="text-[13.5px] text-foreground">{course.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {count} {count === 1 ? "document" : "documents"}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleRemoveCourse(course.id)}
                aria-label={`Remove ${course.name}`}
                className="absolute right-1.5 top-1.5 rounded-md bg-black/30 p-1 text-white opacity-0 transition-opacity hover:bg-black/50 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}

        <AddCourseCard onAdd={(name) => addCourse(name)} />
      </div>

      {selectedCourse && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Upload material for {selectedCourse.name}
            </h2>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-panel-border bg-panel px-6 py-10 text-center transition-colors hover:border-accent">
              <Upload size={22} className="text-accent" />
              <span className="text-[13.5px] text-[var(--text-secondary)]">
                Click to upload a document or lecture
              </span>
              <span className="text-[11px] text-muted">PDF, DOCX, TXT</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Documents
            </h2>
            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
                <p className="text-[13px] text-muted">
                  No documents yet &ndash; upload one above to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-2.5 rounded-lg border border-panel-border bg-panel px-3 py-2.5"
                  >
                    <FileIconLucide size={15} className="shrink-0 text-accent" />
                    <span className="flex-1 truncate text-[13.5px] text-[var(--text-secondary)]">
                      {doc.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {doc.uploadedLabel}
                    </span>
                    <button
                      onClick={() => handleRemove(doc.id)}
                      className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                      aria-label="Remove document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
