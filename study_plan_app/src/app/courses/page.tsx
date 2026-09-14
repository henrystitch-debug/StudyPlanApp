"use client";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  File as FileIconLucide,
  Trash2,
  Plus,
  Sparkles,
  Brain,
  Loader2,
  FileDown,
  Download,
  Copy,
  Check,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import jsPDF from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { type Course } from "@/types/course";
import { gradientForCourse } from "@/components/dashboard/constants";

type TopicIndexItem = {
  title: string;
  description: string;
  location: string;
  effort: number;
};

type DocumentSummary = {
  title: string;
  summary: string;
  topicIndex: TopicIndexItem[];
};

type QuizFlashcard = { question: string; answer: string };
type QuizMcq = { question: string; options: string[]; correctIndex: number };
type QuizOpenText = { question: string; modelAnswer: string };

type Quiz = {
  flashcards: QuizFlashcard[];
  mcq: QuizMcq[];
  openText: QuizOpenText[];
};

type CourseDocument = {
  id: string;
  name: string;
  uploadedLabel: string;
  uploadedAt: number; // Epoch-ms, fürs Sortieren (neuester Upload zuerst)
  file?: File; // fehlt bei Dokumenten, die aus der DB nachgeladen wurden (kein Datei-Handle im Browser)
  courseId: number;
  uploadId?: number;
  isUploading?: boolean;
  uploadError?: string;
  summary?: DocumentSummary;
  isSummarizing?: boolean;
  summaryError?: string;
  isSummaryVisible?: boolean; // steuert, ob der Summary-Block eingeblendet ist ("Summary"-Button)
  isLoadingSummaryView?: boolean;
  summaryViewError?: string;
  quiz?: Quiz;
  isGeneratingQuiz?: boolean;
  quizError?: string;
  isQuizVisible?: boolean; // steuert, ob der Quiz-Block eingeblendet ist ("Quiz"-Anzeige-Button)
  isLoadingQuizView?: boolean;
  quizViewError?: string;
  isQuizContentExpanded?: boolean; // steuert, ob Flashcards/MCQ/Open Text ausgeklappt sind
  isDownloading?: boolean;
  downloadError?: string;
  isSummaryTextExpanded?: boolean;
  isTopicIndexExpanded?: boolean;
  isDeleting?: boolean;
  deleteError?: string;
};

type StudyPlanItem = {
  id?: number; // echte study_plan_item_id - Voraussetzung für "Mark as done"
  uploadId?: number;
  taskName: string;
  description: string;
  location: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isCompleted?: boolean;
  hasConflict?: boolean;
};

type CourseUpload = {
  id: number;
  name: string;
};

type CalendarEvent = {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
};

// Zwei Zeitspannen (HH:MM, gleicher Tag vorausgesetzt) überlappen sich, wenn
// jede vor dem Ende der anderen beginnt.
function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

function AddCourseCard({
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

function EditCourseForm({
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

function downloadSummaryAsPdf(summary: DocumentSummary, sourceFileName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(summary.title, maxWidth);
  doc.text(titleLines, margin, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Source: ${sourceFileName}`, margin, 84 + titleLines.length * 4);
  doc.setTextColor(0);

  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(summary.summary, maxWidth);
  const lineHeight = 16;
  let y = 110 + titleLines.length * 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  bodyLines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  const safeTitle = summary.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`${safeTitle || "summary"}.pdf`);
}

// Reine Textform des Quiz fürs Kopieren in die Zwischenablage.
function quizToText(quiz: Quiz): string {
  const lines: string[] = [];

  if (quiz.flashcards.length > 0) {
    lines.push("FLASHCARDS");
    quiz.flashcards.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.question}`);
      lines.push(`   Answer: ${c.answer}`);
    });
    lines.push("");
  }

  if (quiz.mcq.length > 0) {
    lines.push("MULTIPLE CHOICE");
    quiz.mcq.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      q.options.forEach((option, optionIndex) => {
        lines.push(`   ${optionIndex === q.correctIndex ? "*" : "-"} ${option}`);
      });
    });
    lines.push("");
  }

  if (quiz.openText.length > 0) {
    lines.push("OPEN TEXT");
    quiz.openText.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      lines.push(`   Model answer: ${q.modelAnswer}`);
    });
  }

  return lines.join("\n").trim();
}

function downloadQuizAsPdf(quiz: Quiz, sourceFileName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 15;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(`Quiz - ${sourceFileName}`, maxWidth);
  doc.text(titleLines, margin, y + 14);
  y += 14 + titleLines.length * 20;

  const writeSection = (heading: string, bodyLines: string[]) => {
    if (bodyLines.length === 0) return;
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(heading, margin, y);
    y += lineHeight + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    bodyLines.forEach((line) => {
      const wrapped: string[] = doc.splitTextToSize(line, maxWidth);
      wrapped.forEach((wLine) => {
        ensureSpace(lineHeight);
        doc.text(wLine, margin, y);
        y += lineHeight;
      });
    });
    y += 10;
  };

  const flashcardLines: string[] = [];
  quiz.flashcards.forEach((c, i) => {
    flashcardLines.push(`${i + 1}. ${c.question}`);
    flashcardLines.push(`   Answer: ${c.answer}`);
  });
  writeSection("Flashcards", flashcardLines);

  const mcqLines: string[] = [];
  quiz.mcq.forEach((q, i) => {
    mcqLines.push(`${i + 1}. ${q.question}`);
    q.options.forEach((option, optionIndex) => {
      mcqLines.push(`   ${optionIndex === q.correctIndex ? "[correct]" : "-"} ${option}`);
    });
  });
  writeSection("Multiple Choice", mcqLines);

  const openTextLines: string[] = [];
  quiz.openText.forEach((q, i) => {
    openTextLines.push(`${i + 1}. ${q.question}`);
    openTextLines.push(`   Model answer: ${q.modelAnswer}`);
  });
  writeSection("Open Text", openTextLines);

  const safeName = sourceFileName.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`${safeName || "quiz"}_quiz.pdf`);
}

export default function CoursesPage() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoadingPersistedUploads, setIsLoadingPersistedUploads] = useState(false);
  const [persistedUploadsError, setPersistedUploadsError] = useState<string | null>(null);

  const [studyPlanItems, setStudyPlanItems] = useState<StudyPlanItem[]>([]);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);

  const [showStudyPlanForm, setShowStudyPlanForm] = useState(false);
  const [studyPlanStart, setStudyPlanStart] = useState("");
  const [studyPlanEnd, setStudyPlanEnd] = useState("");
  const [studyPlanCapacity, setStudyPlanCapacity] = useState(5);
  const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false);
  const [generateStudyPlanError, setGenerateStudyPlanError] = useState<string | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  const [isStudyPlanCollapsed, setIsStudyPlanCollapsed] = useState(false);
  const [isDeletingStudyPlan, setIsDeletingStudyPlan] = useState(false);
  const [deleteStudyPlanError, setDeleteStudyPlanError] = useState<string | null>(null);

  // Uploads des Kurses, aus denen man auswählen kann, welche als Grundlage
  // für den Studyplan dienen sollen (statt automatisch alle zu nehmen).
  const [courseUploads, setCourseUploads] = useState<CourseUpload[]>([]);
  const [isLoadingCourseUploads, setIsLoadingCourseUploads] = useState(false);
  const [courseUploadsError, setCourseUploadsError] = useState<string | null>(null);
  const [selectedUploadIds, setSelectedUploadIds] = useState<number[]>([]);

  const [isCourseSwitcherOpen, setIsCourseSwitcherOpen] = useState(false);
  const courseSwitcherRef = useRef<HTMLDivElement>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);

  // Schließt das "Switch courses"-Dropdown bei Klick außerhalb.
  useEffect(() => {
    if (!isCourseSwitcherOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (courseSwitcherRef.current && !courseSwitcherRef.current.contains(e.target as Node)) {
        setIsCourseSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCourseSwitcherOpen]);

  // Not signed in? Bounce to login rather than loading with no real user.
  useEffect(() => {
    if (isAuthed === false) router.replace("/login");
  }, [isAuthed, router]);

  useEffect(() => {
    if (!userId) return; // wait until useAuth has resolved a real user

    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesError(null);
      try {
        const url = new URL("/api/course/coursesWithCounts", window.location.origin);
        url.searchParams.set("userId", `${userId}`);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Kurse konnten nicht geladen werden");
        }

        const list: Course[] = (data.courses ?? []).map(
          (row: {
            course_id: number;
            title: string;
            semester?: string;
            upload_count: string;
          }) => ({
            courseId: row.course_id,
            title: row.title,
            semester: row.semester ?? "",
            uploadCount: Number(row.upload_count),
          })
        );

        setCourses(list);
      } catch (err) {
        setCoursesError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [userId]);

  // Lädt beim Auswählen eines Kurses alle bereits hochgeladenen Dokumente
  // dieses Nutzers für den Kurs aus der DB (GET /api/upload/uploadGetAll) und
  // ergänzt sie in der Dokumentenliste, damit sie auch nach einem Reload noch
  // sichtbar sind (statt nur die in dieser Sitzung neu hochgeladenen).
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchPersistedUploads = async () => {
      setIsLoadingPersistedUploads(true);
      setPersistedUploadsError(null);
      try {
        const response = await fetch(`/api/upload/uploadGetAll?courseId=${selectedCourseId}`);
        const data = await response.json();

        if (response.status === 404) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Dokumente konnten nicht geladen werden");
        }

        const rows: { upload_id: number; file_name: string; uploaded_at?: string }[] =
          data.uploads ?? [];

        setDocuments((prev) => {
          const existingUploadIds = new Set(
            prev.map((d) => d.uploadId).filter((id): id is number => id !== undefined)
          );
          const additions: CourseDocument[] = rows
            .filter((row) => !existingUploadIds.has(row.upload_id))
            .map((row) => ({
              id: `upload-${row.upload_id}`,
              name: row.file_name,
              uploadedLabel: row.uploaded_at
                ? new Date(row.uploaded_at).toLocaleDateString()
                : "",
              uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).getTime() : 0,
              courseId: selectedCourseId,
              uploadId: row.upload_id,
            }));
          return additions.length > 0 ? [...prev, ...additions] : prev;
        });
      } catch (err) {
        setPersistedUploadsError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingPersistedUploads(false);
      }
    };

    fetchPersistedUploads();
  }, [selectedCourseId]);


  // Lädt beim Auswählen eines Kurses einen evtl. schon existierenden Studyplan
  // (GET /api/studyplan/studyplanGet?courseId=...).
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchStudyPlan = async () => {
      setIsLoadingStudyPlan(true);
      setStudyPlanError(null);
      setConflictCount(0);
      try {
        const response = await fetch(`/api/studyplan/studyplanGet?courseId=${selectedCourseId}`);
        const data = await response.json();

        if (response.status === 404) {
          setStudyPlanItems([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Studyplan konnte nicht geladen werden");
        }

        // Die Zeilen kommen aus study_plan_item (task_name, description, location,
        // is_completed, ...) - Datum/Uhrzeit stehen dort nicht mit drin, die Route
        // joint aktuell nicht gegen die verknüpften Kalender-Events.
        const items: StudyPlanItem[] = (data.studyPlan ?? []).map(
          (row: {
            study_plan_item_id: number;
            upload_id?: number;
            task_name: string;
            description: string;
            location: string;
            is_completed: boolean;
            start_time?: string;
            end_time?: string;
          }) => ({
            id: row.study_plan_item_id,
            uploadId: row.upload_id,
            taskName: row.task_name,
            description: row.description,
            location: row.location,
            // scheduledDate steht nicht auf study_plan_item, sondern nur auf dem
            // verknüpften event - die Route joint aktuell nicht dagegen.
            scheduledDate: "",
            startTime: row.start_time ? row.start_time.slice(0, 5) : "",
            endTime: row.end_time ? row.end_time.slice(0, 5) : "",
            isCompleted: row.is_completed,
          })
        );
        setStudyPlanItems(items);
      } catch (err) {
        setStudyPlanError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingStudyPlan(false);
      }
    };

    fetchStudyPlan();
  }, [selectedCourseId]);

  // Lädt beim Öffnen des Studyplan-Formulars alle Uploads des Kurses, damit man
  // auswählen kann, auf deren Basis der Studyplan erstellt werden soll
  // (GET /api/upload/uploadGetAll?courseId=...). Standardmäßig sind alle
  // ausgewählt.
  useEffect(() => {
    if (!showStudyPlanForm || !selectedCourseId) return;

    const fetchCourseUploads = async () => {
      setIsLoadingCourseUploads(true);
      setCourseUploadsError(null);
      try {
        const response = await fetch(`/api/upload/uploadGetAll?courseId=${selectedCourseId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Uploads konnten nicht geladen werden");
        }

        const uploads: CourseUpload[] = (data.uploads ?? []).map(
          (row: { upload_id: number; file_name: string }) => ({ id: row.upload_id, name: row.file_name })
        );
        setCourseUploads(uploads);
        setSelectedUploadIds(uploads.map((u) => u.id));
      } catch (err) {
        setCourseUploadsError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingCourseUploads(false);
      }
    };

    fetchCourseUploads();
  }, [showStudyPlanForm, selectedCourseId]);

  const toggleUploadSelected = (uploadId: number) => {
    setSelectedUploadIds((prev) =>
      prev.includes(uploadId) ? prev.filter((id) => id !== uploadId) : [...prev, uploadId]
    );
  };

  // Erzeugt einen neuen Studyplan: holt zuerst bestehende Kalendertermine im
  // Zeitraum (damit nicht doppelt belegt wird, und um den generierten Plan
  // hinterher auf Konflikte zu prüfen) und die Themen der ausgewählten
  // Uploads, ruft dann POST /api/studyplan/studyplanCreate auf.
  const handleGenerateStudyPlan = async () => {
    if (!userId || !selectedCourseId || !studyPlanStart || !studyPlanEnd) return;
    if (selectedUploadIds.length === 0) {
      setGenerateStudyPlanError("Bitte mindestens ein Dokument auswählen.");
      return;
    }

    setIsGeneratingStudyPlan(true);
    setGenerateStudyPlanError(null);

    try {
      const eventsResponse = await fetch(
        `/api/calendar/eventsRange?userId=${userId}&startDate=${studyPlanStart}&endDate=${studyPlanEnd}`
      );
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { calenderEvents: [] };
      const events: CalendarEvent[] = (eventsData.calenderEvents ?? []).map((row: any) => ({
        date: row.event_date ?? row.date,
        startTime: row.start_time ?? row.startTime,
        endTime: row.end_time ?? row.endTime,
        title: row.description ?? row.title ?? "",
      }));
      // "events" fürs KI-Prompt braucht zusätzlich userId/autoCreated (Calender-Schema).
      const eventsForAI = events.map((e) => ({
        userId,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        autoCreated: true,
        title: e.title,
      }));

      const topicsResponse = await fetch(`/api/topicItem/topicIndicesGet?courseId=${selectedCourseId}`);
      const topicsData = await topicsResponse.json();

      if (!topicsResponse.ok) {
        throw new Error(topicsData.error ?? "Themen des Kurses konnten nicht geladen werden");
      }

      // Flache Zeilen (ein Eintrag pro Thema, mit upload_id) nach upload_id
      // gruppieren - die KI braucht die uploadId pro Gruppe, um sie den
      // generierten Einträgen zuzuordnen (studyplanResponseSchema verlangt sie).
      // Nur die ausgewählten Uploads werden berücksichtigt.
      const grouped = new Map<number, TopicIndexItem[]>();
      for (const row of topicsData.topicIndices ?? []) {
        if (!selectedUploadIds.includes(row.upload_id)) continue;
        const list = grouped.get(row.upload_id) ?? [];
        list.push({
          title: row.title,
          description: row.description,
          location: row.location,
          effort: row.estimated_effort,
        });
        grouped.set(row.upload_id, list);
      }
      const topicIndices = Array.from(grouped.entries()).map(([uploadId, items]) => ({
        uploadId,
        items,
      }));

      const response = await fetch("/api/studyplan/studyplanCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId: selectedCourseId,
          startDate: studyPlanStart,
          endDate: studyPlanEnd,
          events: eventsForAI,
          topicIndices,
          capacity: studyPlanCapacity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Studyplan konnte nicht erstellt werden");
      }

      // Prüft, ob die KI trotz Anweisung doch eine bestehende Kalender-Zeit
      // getroffen hat, und markiert betroffene Einträge.
      const items: StudyPlanItem[] = (data.studyplan ?? []).map((item: StudyPlanItem) => ({
        ...item,
        hasConflict: events.some(
          (e) =>
            e.date === item.scheduledDate &&
            timeRangesOverlap(item.startTime, item.endTime, e.startTime, e.endTime)
        ),
      }));

      setConflictCount(items.filter((i) => i.hasConflict).length);
      setStudyPlanItems(items);
      setShowStudyPlanForm(false);
    } catch (err) {
      setGenerateStudyPlanError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsGeneratingStudyPlan(false);
    }
  };

  // Markiert einen Studyplan-Eintrag als (nicht) erledigt per
  // PUT /api/studyplan/studyItemEdit.
  const handleToggleStudyItemDone = async (item: StudyPlanItem) => {
    if (!item.id) return;

    const nextCompleted = !item.isCompleted;
    setStudyPlanItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isCompleted: nextCompleted } : i))
    );

    try {
      const response = await fetch("/api/studyplan/studyItemEdit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isCompleted: nextCompleted }),
      });

      if (!response.ok) {
        // bei Fehlschlag den optimistischen Toggle zurückrollen
        setStudyPlanItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isCompleted: item.isCompleted } : i))
        );
      }
    } catch {
      setStudyPlanItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isCompleted: item.isCompleted } : i))
      );
    }
  };

  // Löscht den kompletten Studyplan des Kurses per DELETE /api/studyplan/studyplanDelete
  // (löscht dort auch die verknüpften Kalender-Events mit).
  const handleDeleteStudyPlan = async () => {
    if (!selectedCourseId) return;

    setIsDeletingStudyPlan(true);
    setDeleteStudyPlanError(null);
    try {
      const response = await fetch(
        `/api/studyplan/studyplanDelete?courseId=${selectedCourseId}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Studyplan konnte nicht gelöscht werden");
      }

      setStudyPlanItems([]);
      setConflictCount(0);
    } catch (err) {
      setDeleteStudyPlanError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsDeletingStudyPlan(false);
    }
  };

  // Löschen/Anzeigen bereits gespeicherter Zusammenfassungen läuft jetzt direkt über
  // die "View summary"-Aktion am jeweiligen Dokument (handleViewSummary weiter unten)
  // statt über eine separate "Saved Summaries"-Box - handleOpenSavedSummary /
  // handleDeleteSummary wurden deshalb entfernt.
  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId);
  const otherCourses = courses.filter((c) => c.courseId !== selectedCourseId);
  const existingSemesters = Array.from(
    new Set(courses.map((c) => c.semester).filter((s): s is string => Boolean(s)))
  );
  // Neuester Upload immer ganz oben, unabhängig davon, in welcher Reihenfolge
  // die Dokumente (Session-Uploads + aus der DB nachgeladene) in den State kamen.
  const visibleDocuments = documents
    .filter((d) => d.courseId === selectedCourseId)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);

  // Für die Anzeige "aus welchem Dokument stammt dieser Studyplan-Eintrag" -
  // documents enthält inzwischen alle Uploads des Kurses (Session + DB).
  const uploadNameById = new Map(
    visibleDocuments
      .filter((d): d is CourseDocument & { uploadId: number } => d.uploadId !== undefined)
      .map((d) => [d.uploadId, d.name])
  );

  const handleFileUpload = async (file: File) => {
    if (!selectedCourseId) return;

    const id = `${Date.now()}`;
    setDocuments((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        uploadedLabel: "just now",
        uploadedAt: Date.now(),
        file,
        courseId: selectedCourseId,
        isUploading: true,
      },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", String(selectedCourseId));

      const response = await fetch("/api/upload/uploadPost", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Upload fehlgeschlagen");
      }

      // uploadPost gibt jetzt die volle DB-Zeile zurück ({ upload_id, course_id,
      // file_name, mime_type, data, uploaded_at }), nicht mehr ein "uploadId"-Feld.
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, isUploading: false, uploadId: data.response?.upload_id }
            : d
        )
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isUploading: false,
                uploadError: err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  // Löscht ein Dokument per DELETE /api/upload/uploadDelete aus der DB (kaskadiert
  // dort auf zugehörige Summaries/Topic-Index/Quiz) und danach aus der Anzeige.
  // Existiert noch keine uploadId (Upload läuft noch/ist fehlgeschlagen), wird
  // nur lokal entfernt, da serverseitig noch nichts gespeichert wurde.
  const handleRemove = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    if (!doc.uploadId) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isDeleting: true, deleteError: undefined } : d))
    );

    try {
      const response = await fetch(`/api/upload/uploadDelete?uploadId=${doc.uploadId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Dokument konnte nicht gelöscht werden");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isDeleting: false,
                deleteError: err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  const toggleSummaryTextExpanded = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isSummaryTextExpanded: !d.isSummaryTextExpanded } : d
      )
    );
  };

  const toggleTopicIndexExpanded = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isTopicIndexExpanded: !d.isTopicIndexExpanded } : d
      )
    );
  };

  const toggleQuizContentExpanded = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isQuizContentExpanded: !d.isQuizContentExpanded } : d
      )
    );
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      // TODO: Fallback für Browser ohne Clipboard-API, falls relevant.
    }
  };

  const handleGenerateSummary = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !doc.uploadId) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isSummarizing: true, summaryError: undefined } : d
      )
    );

    try {
      const response = await fetch("/api/summary/summaryCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: doc.uploadId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Zusammenfassung fehlgeschlagen");
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isSummarizing: false,
                isSummaryVisible: true,
                summary: {
                  title: data.title,
                  summary: data.summary,
                  topicIndex: data.topicIndex ?? [],
                },
              }
            : d
        )
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isSummarizing: false,
                summaryError:
                  err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  // Zeigt eine bereits gespeicherte Zusammenfassung zu diesem Dokument an
  // (GET /api/summary/summaryGet, sucht dort per upload_id) - ersetzt die
  // frühere separate "Saved Summaries"-Box, der Button sitzt jetzt direkt am
  // jeweiligen Dokument.
  const handleViewSummary = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !doc.uploadId) return;

    // Schon eingeblendet -> nur wieder einklappen.
    if (doc.isSummaryVisible) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isSummaryVisible: false } : d))
      );
      return;
    }

    // Schon geladen (z.B. gerade erst generiert) -> nur wieder einblenden.
    if (doc.summary) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isSummaryVisible: true } : d))
      );
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, isLoadingSummaryView: true, summaryViewError: undefined }
          : d
      )
    );

    try {
      const response = await fetch(`/api/summary/summaryGet?id=${doc.uploadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Keine gespeicherte Zusammenfassung gefunden");
      }

      // summaryGet liefert die volle DB-Zeile (summary_id, upload_id, title,
      // content, ...) - Topic Index wird hier nicht mitgeladen, bleibt leer.
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isLoadingSummaryView: false,
                isSummaryVisible: true,
                summary: {
                  title: data.summary?.title ?? "Summary",
                  summary: data.summary?.content ?? "",
                  topicIndex: d.summary?.topicIndex ?? [],
                },
              }
            : d
        )
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isLoadingSummaryView: false,
                summaryViewError:
                  err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  const handleGenerateQuiz = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !doc.uploadId) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isGeneratingQuiz: true, quizError: undefined } : d
      )
    );

    try {
      const response = await fetch("/api/quiz/quizCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: doc.uploadId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Quiz-Erstellung fehlgeschlagen");
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isGeneratingQuiz: false,
                isQuizVisible: true,
                isQuizContentExpanded: true,
                quiz: {
                  flashcards: data.flashcards ?? [],
                  mcq: data.mcq ?? [],
                  openText: data.openText ?? [],
                },
              }
            : d
        )
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isGeneratingQuiz: false,
                quizError: err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  // Zeigt ein bereits gespeichertes Quiz zu diesem Dokument an (GET
  // /api/quiz/quizGetForUpload) - ohne es neu zu generieren.
  const handleViewQuiz = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !doc.uploadId) return;

    if (doc.isQuizVisible) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isQuizVisible: false } : d))
      );
      return;
    }

    if (doc.quiz) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, isQuizVisible: true, isQuizContentExpanded: true } : d
        )
      );
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, isLoadingQuizView: true, quizViewError: undefined }
          : d
      )
    );

    try {
      const response = await fetch(`/api/quiz/quizGetForUpload?uploadId=${doc.uploadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Kein gespeichertes Quiz gefunden");
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isLoadingQuizView: false,
                isQuizVisible: true,
                isQuizContentExpanded: true,
                quiz: data.quiz,
              }
            : d
        )
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isLoadingQuizView: false,
                quizViewError: err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  // Holt die Originaldatei über GET /api/upload/uploadGetById und stößt einen
  // Browser-Download an, statt nur die (im Frontend gehaltene) Kopie zu nutzen.
  const handleDownloadOriginal = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !doc.uploadId) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isDownloading: true, downloadError: undefined } : d
      )
    );

    try {
      const response = await fetch(`/api/upload/uploadGetById?uploadId=${doc.uploadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Download fehlgeschlagen");
      }

      // uploadGetById liefert jetzt die volle DB-Zeile direkt (file_name, mime_type,
      // data), nicht mehr verschachtelt unter einem eigenen "data"-Objekt.
      const uploadData = data.upload;
      const filename = uploadData?.file_name || doc.name;
      const mimeType = uploadData?.mime_type || "application/octet-stream";
      const rawBytes = uploadData?.data;

      // Buffer wird über JSON als { type: "Buffer", data: number[] } serialisiert.
      const blob =
        rawBytes && typeof rawBytes === "object" && Array.isArray(rawBytes.data)
          ? new Blob([new Uint8Array(rawBytes.data)], { type: mimeType })
          : new Blob([rawBytes ?? ""], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isDownloading: false } : d))
      );
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isDownloading: false,
                downloadError: err instanceof Error ? err.message : "Unbekannter Fehler",
              }
            : d
        )
      );
    }
  };

  return (
    <>
      <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        Your Courses
      </h1>

      {isLoadingCourses ? (
        <div className="mb-8 flex min-h-[132px] items-center justify-center rounded-xl border border-panel-border bg-panel text-[12.5px] text-muted">
          Loading courses…
        </div>
      ) : coursesError ? (
        <div className="mb-8 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-6 text-center text-[13px] text-rose">
          {coursesError}
        </div>
      ) : selectedCourse && isEditingCourse ? (
        <div className="mb-8">
          <EditCourseForm
            course={selectedCourse}
            existingSemesters={existingSemesters}
            onSaved={(updated) => {
              setCourses((prev) => prev.map((c) => (c.courseId === updated.courseId ? updated : c)));
              setIsEditingCourse(false);
            }}
            onCancel={() => setIsEditingCourse(false)}
          />
        </div>
      ) : selectedCourse ? (
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Current course</p>
            <p className="text-[17px] font-medium capitalize text-foreground font-serif">
              {selectedCourse.title}
              {selectedCourse.semester && (
                <span className="ml-2 text-[12.5px] font-sans font-normal text-muted">
                  {selectedCourse.semester}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingCourse(true)}
              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
            >
              <Pencil size={14} />
              Edit
            </button>

            <div className="relative" ref={courseSwitcherRef}>
            <button
              onClick={() => setIsCourseSwitcherOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
            >
              <Layers size={14} />
              Switch courses
              <ChevronDown size={14} />
            </button>

            {isCourseSwitcherOpen && (
              <div className="absolute right-0 z-10 mt-2 w-60 rounded-xl border border-panel-border bg-panel p-1.5 shadow-lg">
                {otherCourses.length === 0 ? (
                  <p className="px-2.5 py-2 text-[12.5px] text-muted">No other courses yet</p>
                ) : (
                  otherCourses.map((course) => (
                    <button
                      key={course.courseId}
                      onClick={() => {
                        setSelectedCourseId(course.courseId);
                        setIsCourseSwitcherOpen(false);
                      }}
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--overlay)]"
                    >
                      <span className="text-[13px] capitalize text-foreground">{course.title}</span>
                      {course.semester && (
                        <span className="text-[11px] text-muted">{course.semester}</span>
                      )}
                    </button>
                  ))
                )}
                <div className="my-1 border-t border-panel-border" />
                <button
                  onClick={() => {
                    setSelectedCourseId(null);
                    setIsCourseSwitcherOpen(false);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
                >
                  <Plus size={14} />
                  Show all courses
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {courses.map((course, i) => (
            <button
              key={course.courseId}
              onClick={() => setSelectedCourseId(course.courseId)}
              className="overflow-hidden rounded-xl border border-panel-border bg-panel text-left transition-colors hover:border-accent"
            >
              <div className={`h-20 w-full bg-gradient-to-br ${gradientForCourse(i)}`} /> 
              <div className="p-3">
                <p className="text-[13.5px] capitalize text-foreground">
                  {course.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {course.uploadCount ?? 0} document{course.uploadCount === 1 ? "" : "s"}
                </p>
              </div>
            </button>
          ))}

          {userId && (
            <AddCourseCard
              userId={userId}
              existingSemesters={existingSemesters}
              onCreated={(course) => {
                setCourses((prev) => [...prev, course]);
                setSelectedCourseId(course.courseId);
              }}
            />
          )}
        </div>
      )}

      {selectedCourse && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Upload material for <span className="capitalize">{selectedCourse.title}</span>
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

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsStudyPlanCollapsed((v) => !v)}
                className="flex items-center gap-1.5 text-[15px] font-medium text-foreground font-serif hover:text-[var(--text-secondary)]"
              >
                {isStudyPlanCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                Study Plan
              </button>
              <div className="flex shrink-0 items-center gap-2">
                {studyPlanItems.length > 0 && (
                  <button
                    onClick={handleDeleteStudyPlan}
                    disabled={isDeletingStudyPlan}
                    className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] hover:text-rose disabled:opacity-50"
                  >
                    {isDeletingStudyPlan ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowStudyPlanForm((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
                >
                  <CalendarPlus size={13} />
                  {studyPlanItems.length > 0 ? "Regenerate" : "Generate Study Plan"}
                </button>
              </div>
            </div>

            {deleteStudyPlanError && (
              <p className="mb-3 text-[12.5px] text-rose">{deleteStudyPlanError}</p>
            )}

            {!isStudyPlanCollapsed && (
            <>
            {showStudyPlanForm && (
              <div className="mb-3 flex flex-col gap-2.5 rounded-xl border border-panel-border bg-panel p-3.5">
                <div>
                  <p className="mb-1.5 text-[11.5px] text-muted">
                    Base the plan on these documents
                  </p>
                  {isLoadingCourseUploads ? (
                    <p className="text-[12.5px] text-muted">Loading…</p>
                  ) : courseUploadsError ? (
                    <p className="text-[12px] text-rose">{courseUploadsError}</p>
                  ) : courseUploads.length === 0 ? (
                    <p className="text-[12.5px] text-muted">
                      No documents uploaded for this course yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {courseUploads.map((upload) => (
                        <li key={upload.id}>
                          <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]">
                            <input
                              type="checkbox"
                              checked={selectedUploadIds.includes(upload.id)}
                              onChange={() => toggleUploadSelected(upload.id)}
                              className="accent-accent"
                            />
                            {upload.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-2.5">
                  <label className="flex flex-col gap-1 text-[11.5px] text-muted">
                    Start date
                    <input
                      type="date"
                      value={studyPlanStart}
                      onChange={(e) => setStudyPlanStart(e.target.value)}
                      className="rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1.5 text-[13px] text-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11.5px] text-muted">
                    End date
                    <input
                      type="date"
                      value={studyPlanEnd}
                      onChange={(e) => setStudyPlanEnd(e.target.value)}
                      className="rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1.5 text-[13px] text-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11.5px] text-muted">
                    Hours / week
                    <input
                      type="number"
                      min={1}
                      value={studyPlanCapacity}
                      onChange={(e) => setStudyPlanCapacity(Number(e.target.value))}
                      className="w-20 rounded-md border border-panel-border bg-[var(--sunken)] px-2 py-1.5 text-[13px] text-foreground"
                    />
                  </label>
                  <button
                    onClick={handleGenerateStudyPlan}
                    disabled={
                      isGeneratingStudyPlan ||
                      !studyPlanStart ||
                      !studyPlanEnd ||
                      selectedUploadIds.length === 0
                    }
                    className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                  >
                    {isGeneratingStudyPlan ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {isGeneratingStudyPlan ? "Generating…" : "Generate"}
                  </button>
                </div>
                {generateStudyPlanError && (
                  <p className="text-[12px] text-rose">{generateStudyPlanError}</p>
                )}
              </div>
            )}

            {isLoadingStudyPlan ? (
              <p className="text-[13px] text-muted">Loading…</p>
            ) : studyPlanError ? (
              <p className="text-[13px] text-rose">{studyPlanError}</p>
            ) : studyPlanItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
                <p className="text-[13px] text-muted">
                  No study plan yet &ndash; generate one above.
                </p>
              </div>
            ) : (
              <>
                {conflictCount > 0 && (
                  <p className="mb-2 text-[12.5px] text-rose">
                    ⚠ {conflictCount} session{conflictCount > 1 ? "s" : ""} overlap
                    {conflictCount === 1 ? "s" : ""} with an existing calendar entry — check the
                    highlighted items below.
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {studyPlanItems.map((item, i) => {
                    const sourceName = item.uploadId ? uploadNameById.get(item.uploadId) : undefined;
                    return (
                      <li
                        key={item.id ?? i}
                        className={`flex gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                          item.hasConflict
                            ? "border-rose/40 bg-rose/5"
                            : item.isCompleted
                            ? "border-panel-border bg-[var(--sunken)]"
                            : "border-panel-border bg-panel hover:border-accent/40"
                        }`}
                      >
                        <button
                          onClick={() => handleToggleStudyItemDone(item)}
                          disabled={!item.id}
                          aria-label={item.isCompleted ? "Mark as not done" : "Mark as done"}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
                            item.isCompleted
                              ? "border-accent bg-accent"
                              : "border-panel-border bg-[var(--sunken)]"
                          }`}
                        >
                          {item.isCompleted && (
                            <Check size={12} strokeWidth={3} className="text-accent-foreground" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <p
                              className={`text-[13.5px] font-medium ${
                                item.isCompleted ? "text-muted line-through" : "text-foreground"
                              }`}
                            >
                              {item.taskName}
                            </p>
                            {(item.scheduledDate || item.startTime) && (
                              <span
                                className={`flex shrink-0 items-center gap-1 text-[11px] ${
                                  item.hasConflict ? "text-rose" : "text-muted"
                                }`}
                              >
                                {item.hasConflict && "⚠"}
                                {item.scheduledDate && (
                                  <>
                                    <CalendarDays size={11} />
                                    {item.scheduledDate}
                                  </>
                                )}
                                {item.startTime && (
                                  <>
                                    <Clock size={11} className="ml-1" />
                                    {item.startTime}–{item.endTime}
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-[12.5px] leading-snug ${
                              item.isCompleted ? "text-muted" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {item.description}
                          </p>

                          {(item.location || sourceName) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {item.location && (
                                <span className="text-[11px] text-muted">{item.location}</span>
                              )}
                              {sourceName && (
                                <span className="flex items-center gap-1 rounded-full border border-panel-border bg-[var(--overlay)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                                  <FileIconLucide size={11} className="text-accent" />
                                  {sourceName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            </>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Documents
            </h2>
            {persistedUploadsError && (
              <p className="mb-2 text-[12px] text-rose">{persistedUploadsError}</p>
            )}
            {isLoadingPersistedUploads && visibleDocuments.length === 0 ? (
              <p className="text-[13px] text-muted">Loading…</p>
            ) : visibleDocuments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
                <p className="text-[13px] text-muted">
                  No documents yet &ndash; upload one above to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg border border-panel-border bg-panel"
                  >
                    <div className="group flex items-center gap-2.5 px-3 py-2.5">
                      <FileIconLucide size={15} className="shrink-0 text-accent" />
                      <span className="max-w-[30%] shrink truncate text-[13.5px] text-[var(--text-secondary)]">
                        {doc.name}
                      </span>

                      <button
                        onClick={() => handleViewSummary(doc.id)}
                        disabled={doc.isLoadingSummaryView || doc.isUploading || !doc.uploadId}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                      >
                        {doc.isLoadingSummaryView ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : doc.isSummaryVisible ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                        {doc.isLoadingSummaryView
                          ? "Loading…"
                          : doc.isSummaryVisible
                          ? "Hide summary"
                          : "View summary"}
                      </button>

                      <button
                        onClick={() => handleViewQuiz(doc.id)}
                        disabled={doc.isLoadingQuizView || doc.isUploading || !doc.uploadId}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                      >
                        {doc.isLoadingQuizView ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : doc.isQuizVisible ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                        {doc.isLoadingQuizView
                          ? "Loading…"
                          : doc.isQuizVisible
                          ? "Hide quiz"
                          : "View quiz"}
                      </button>

                      <span className="flex-1" />

                      <span className="shrink-0 text-[11px] text-muted">
                        {doc.isUploading ? "uploading…" : doc.uploadedLabel}
                      </span>

                      <button
                        onClick={() => handleGenerateSummary(doc.id)}
                        disabled={doc.isSummarizing || doc.isUploading || !doc.uploadId}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                      >
                        {doc.isSummarizing ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        {doc.isSummarizing ? "Generating…" : "Summarize"}
                      </button>

                      <button
                        onClick={() => handleGenerateQuiz(doc.id)}
                        disabled={doc.isGeneratingQuiz || doc.isUploading || !doc.uploadId}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                      >
                        {doc.isGeneratingQuiz ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Brain size={13} />
                        )}
                        {doc.isGeneratingQuiz ? "Generating…" : "Quiz"}
                      </button>

                      <button
                        onClick={() => handleDownloadOriginal(doc.id)}
                        disabled={doc.isDownloading || doc.isUploading || !doc.uploadId}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)] disabled:opacity-50"
                      >
                        {doc.isDownloading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        {doc.isDownloading ? "Downloading…" : "Original"}
                      </button>

                      <button
                        onClick={() => handleRemove(doc.id)}
                        disabled={doc.isDeleting}
                        className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 disabled:opacity-50"
                        aria-label="Delete document"
                      >
                        {doc.isDeleting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                    {doc.deleteError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.deleteError}
                      </p>
                    )}

                    {doc.uploadError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.uploadError}
                      </p>
                    )}

                    {doc.summaryError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.summaryError}
                      </p>
                    )}

                    {doc.quizError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.quizError}
                      </p>
                    )}

                    {doc.summaryViewError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.summaryViewError}
                      </p>
                    )}

                    {doc.quizViewError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.quizViewError}
                      </p>
                    )}

                    {doc.downloadError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.downloadError}
                      </p>
                    )}

                    {doc.summary && doc.isSummaryVisible && (
                      <div className="border-t border-panel-border px-3 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium text-foreground">
                            {doc.summary.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() =>
                                handleCopy(doc.id, doc.summary!.summary)
                              }
                              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
                            >
                              {copiedId === doc.id ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}
                              {copiedId === doc.id ? "Copied" : "Copy"}
                            </button>
                            <button
                              onClick={() =>
                                downloadSummaryAsPdf(doc.summary!, doc.name)
                              }
                              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
                            >
                              <FileDown size={13} />
                              PDF
                            </button>
                          </div>
                        </div>

                        <textarea
                          readOnly
                          value={doc.summary.summary}
                          rows={doc.isSummaryTextExpanded ? 16 : 3}
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-full resize-y rounded-md border border-panel-border bg-[var(--sunken)] p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                          onClick={() => toggleSummaryTextExpanded(doc.id)}
                          className="mt-1 flex items-center gap-1 text-[11.5px] text-muted hover:text-[var(--text-secondary)]"
                        >
                          {doc.isSummaryTextExpanded ? (
                            <>
                              <ChevronUp size={13} /> Minimize
                            </>
                          ) : (
                            <>
                              <ChevronDown size={13} /> Expand
                            </>
                          )}
                        </button>

                        {doc.summary.topicIndex.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleTopicIndexExpanded(doc.id)}
                              className="mb-1.5 flex items-center gap-1 text-[11.5px] font-medium text-[var(--text-secondary)] hover:text-foreground"
                            >
                              {doc.isTopicIndexExpanded ? (
                                <ChevronUp size={13} />
                              ) : (
                                <ChevronDown size={13} />
                              )}
                              Topic Index ({doc.summary.topicIndex.length})
                            </button>
                            {doc.isTopicIndexExpanded && (
                              <ul className="flex flex-col gap-1.5">
                                {doc.summary.topicIndex.map((item, i) => (
                                  <li
                                    key={i}
                                    className="rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-secondary)]"
                                  >
                                    <span className="font-medium text-foreground">{item.title}</span>
                                    {" — "}
                                    {item.description}
                                    <span className="ml-1 text-muted">
                                      ({item.location}, effort: {item.effort})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {doc.quiz && doc.isQuizVisible && (
                      <div className="border-t border-panel-border px-3 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium text-foreground">
                            Quiz ({doc.quiz.flashcards.length} flashcards &middot;{" "}
                            {doc.quiz.mcq.length} MCQ &middot; {doc.quiz.openText.length} open text)
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => handleCopy(doc.id, quizToText(doc.quiz!))}
                              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
                            >
                              {copiedId === doc.id ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}
                              {copiedId === doc.id ? "Copied" : "Copy"}
                            </button>
                            <button
                              onClick={() => downloadQuizAsPdf(doc.quiz!, doc.name)}
                              className="flex items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
                            >
                              <FileDown size={13} />
                              PDF
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleQuizContentExpanded(doc.id)}
                          className="mb-1.5 flex items-center gap-1 text-[11.5px] font-medium text-[var(--text-secondary)] hover:text-foreground"
                        >
                          {doc.isQuizContentExpanded ? (
                            <>
                              <ChevronUp size={13} /> Minimize
                            </>
                          ) : (
                            <>
                              <ChevronDown size={13} /> Expand
                            </>
                          )}
                        </button>

                        {doc.isQuizContentExpanded && (
                        <div className="flex flex-col gap-3">
                          {doc.quiz.flashcards.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                                Flashcards
                              </p>
                              <ul className="flex flex-col gap-1.5">
                                {doc.quiz.flashcards.map((card, i) => (
                                  <li
                                    key={i}
                                    className="rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-secondary)]"
                                  >
                                    <span className="font-medium text-foreground">{card.question}</span>
                                    {" — "}
                                    {card.answer}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {doc.quiz.mcq.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                                Multiple Choice
                              </p>
                              <ul className="flex flex-col gap-1.5">
                                {doc.quiz.mcq.map((q, i) => (
                                  <li
                                    key={i}
                                    className="rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-secondary)]"
                                  >
                                    <p className="mb-1 font-medium text-foreground">{q.question}</p>
                                    <ul className="flex flex-col gap-0.5 pl-3">
                                      {q.options.map((option, optionIndex) => (
                                        <li
                                          key={optionIndex}
                                          className={
                                            optionIndex === q.correctIndex
                                              ? "text-accent"
                                              : undefined
                                          }
                                        >
                                          {option}
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {doc.quiz.openText.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                                Open Text
                              </p>
                              <ul className="flex flex-col gap-1.5">
                                {doc.quiz.openText.map((q, i) => (
                                  <li
                                    key={i}
                                    className="rounded-md border border-panel-border bg-[var(--sunken)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-secondary)]"
                                  >
                                    <span className="font-medium text-foreground">{q.question}</span>
                                    {" — "}
                                    {q.modelAnswer}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    )}
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