"use client";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import jsPDF from "jspdf";

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
  file: File;
  courseId: number;
  uploadId?: number; // vom Server vergebene Id, Voraussetzung für Summary-/Quiz-Request
  isUploading?: boolean;
  uploadError?: string;
  summary?: DocumentSummary;
  isSummarizing?: boolean;
  summaryError?: string;
  quiz?: Quiz;
  isGeneratingQuiz?: boolean;
  quizError?: string;
  isDownloading?: boolean;
  downloadError?: string;
  isSummaryTextExpanded?: boolean;
  isTopicIndexExpanded?: boolean;
};

type Course = {
  id: number;
  name: string;
  semester?: string;
};

type StudyPlanItem = {
  taskName: string;
  description: string;
  location: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isCompleted?: boolean;
};

// TODO: durch echte uid aus einem Login/Auth-System ersetzen, sobald es das gibt.
const CURRENT_UID = 26;

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
        id: data.course.course_id,
        name: data.course.title,
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [summaryTitles, setSummaryTitles] = useState<
    { id: number; summaryId: number; title: string }[]
  >([]);
  const [deletingSummaryId, setDeletingSummaryId] = useState<number | null>(null);
  const [deleteSummaryError, setDeleteSummaryError] = useState<string | null>(null);
  const [isLoadingSummaryTitles, setIsLoadingSummaryTitles] = useState(false);
  const [summaryTitlesError, setSummaryTitlesError] = useState<string | null>(null);

  const [openSummaryId, setOpenSummaryId] = useState<number | null>(null);
  const [openSummaryText, setOpenSummaryText] = useState<string | null>(null);
  const [isLoadingOpenSummary, setIsLoadingOpenSummary] = useState(false);
  const [openSummaryError, setOpenSummaryError] = useState<string | null>(null);

  const [studyPlanItems, setStudyPlanItems] = useState<StudyPlanItem[]>([]);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);

  const [showStudyPlanForm, setShowStudyPlanForm] = useState(false);
  const [studyPlanStart, setStudyPlanStart] = useState("");
  const [studyPlanEnd, setStudyPlanEnd] = useState("");
  const [studyPlanCapacity, setStudyPlanCapacity] = useState(5);
  const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false);
  const [generateStudyPlanError, setGenerateStudyPlanError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesError(null);
      try {
        const response = await fetch(`/api/course/coursesAll?uid=${CURRENT_UID}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Kurse konnten nicht geladen werden");
        }

        // Echte DB-Zeilen: { course_id, title, semester }.
        const list: Course[] = (data.courses ?? []).map(
          (row: { course_id: number; title: string; semester?: string }) => ({
            id: row.course_id,
            name: row.title,
            semester: row.semester,
          })
        );

        setCourses(list);
        setSelectedCourseId((current) => current ?? list[0]?.id ?? null);
      } catch (err) {
        setCoursesError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Lädt beim Auswählen eines Kurses die Titel bereits gespeicherter
  // Zusammenfassungen (GET /api/summary/summaryGetTitles). Die Route selbst
  // kennt aktuell keinen courseId-Filter - sie liefert immer alle Titel -
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchSummaryTitles = async () => {
      setIsLoadingSummaryTitles(true);
      setSummaryTitlesError(null);
      setOpenSummaryId(null);
      setOpenSummaryText(null);
      try {
        const response = await fetch(`/api/summary/summaryGetTitles?courseId=${selectedCourseId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Titel konnten nicht geladen werden");
        }

        // Jede Zeile ist { summary_id, upload_id, title } - summaryGet sucht per
        // upload_id (id), summaryDelete per summary_id (summaryId).
        const titles: { id: number; summaryId: number; title: string }[] = (data.titles ?? []).map(
          (row: { summary_id: number; upload_id: number; title: string }) => ({
            id: row.upload_id,
            summaryId: row.summary_id,
            title: row.title,
          })
        );
        setSummaryTitles(titles);
      } catch (err) {
        setSummaryTitlesError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setIsLoadingSummaryTitles(false);
      }
    };

    fetchSummaryTitles();
  }, [selectedCourseId]);

  // Lädt beim Auswählen eines Kurses einen evtl. schon existierenden Studyplan
  // (GET /api/studyplan/studyplanGet?courseId=...).
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchStudyPlan = async () => {
      setIsLoadingStudyPlan(true);
      setStudyPlanError(null);
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
          (row: { task_name: string; description: string; location: string; is_completed: boolean }) => ({
            taskName: row.task_name,
            description: row.description,
            location: row.location,
            scheduledDate: "",
            startTime: "",
            endTime: "",
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

  // Erzeugt einen neuen Studyplan: holt zuerst bestehende Kalendertermine im
  // Zeitraum (damit nicht doppelt belegt wird) und alle Themen des Kurses,
  // ruft dann POST /api/studyplan/studyplanCreate auf.
  const handleGenerateStudyPlan = async () => {
    if (!selectedCourseId || !studyPlanStart || !studyPlanEnd) return;

    setIsGeneratingStudyPlan(true);
    setGenerateStudyPlanError(null);

    try {
      const eventsResponse = await fetch(
        `/api/calendar/calenderRangeEvents?userId=${CURRENT_UID}&startDate=${studyPlanStart}&endDate=${studyPlanEnd}`
      );
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { calenderEvents: [] };
      const events = (eventsData.calenderEvents ?? []).map((row: any) => ({
        userId: CURRENT_UID,
        date: row.event_date ?? row.date,
        startTime: row.start_time ?? row.startTime,
        endTime: row.end_time ?? row.endTime,
        autoCreated: row.ai_generated ?? row.autoCreated ?? false,
        title: row.description ?? row.title ?? "",
      }));

      const topicsResponse = await fetch(`/api/topicIndexOfCourse?courseId=${selectedCourseId}`);
      const topicsData = await topicsResponse.json();

      if (!topicsResponse.ok) {
        throw new Error(topicsData.error ?? "Themen des Kurses konnten nicht geladen werden");
      }

      // Flache Zeilen (ein Eintrag pro Thema, mit upload_id) nach upload_id
      // gruppieren, wie es topicIndeces (indexItem[][]) erwartet.
      const grouped = new Map<number, TopicIndexItem[]>();
      for (const row of topicsData.topicItems ?? []) {
        const list = grouped.get(row.upload_id) ?? [];
        list.push({
          title: row.title,
          description: row.description,
          location: row.location,
          effort: row.estimated_effort,
        });
        grouped.set(row.upload_id, list);
      }
      const topicIndeces = Array.from(grouped.values());

      const response = await fetch("/api/studyplan/studyplanCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: CURRENT_UID,
          courseId: selectedCourseId,
          startDate: studyPlanStart,
          endDate: studyPlanEnd,
          events,
          topicIndeces,
          capacity: studyPlanCapacity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Studyplan konnte nicht erstellt werden");
      }

      setStudyPlanItems(data.studyplan ?? []);
      setShowStudyPlanForm(false);
    } catch (err) {
      setGenerateStudyPlanError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsGeneratingStudyPlan(false);
    }
  };

  // Lädt die volle Zusammenfassung zu einem Titel per GET /api/summary/summaryGet.
  const handleOpenSavedSummary = async (id: number) => {
    if (openSummaryId === id) {
      setOpenSummaryId(null);
      setOpenSummaryText(null);
      return;
    }

    setOpenSummaryId(id);
    setOpenSummaryText(null);
    setOpenSummaryError(null);
    setIsLoadingOpenSummary(true);
    try {
      const response = await fetch(`/api/summary/summaryGet?id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Zusammenfassung konnte nicht geladen werden");
      }

      // summaryGet liefert jetzt die volle DB-Zeile (summary_id, upload_id, title,
      // content, ...) statt eines reinen Strings - der Text steht in "content".
      setOpenSummaryText(data.summary?.content ?? null);
    } catch (err) {
      setOpenSummaryError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoadingOpenSummary(false);
    }
  };

  // Löscht eine gespeicherte Zusammenfassung per DELETE /api/summary/summaryDelete.
  const handleDeleteSummary = async (entry: { id: number; summaryId: number }) => {
    setDeletingSummaryId(entry.summaryId);
    setDeleteSummaryError(null);
    try {
      const response = await fetch(`/api/summary/summaryDelete?id=${entry.summaryId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Zusammenfassung konnte nicht gelöscht werden");
      }

      setSummaryTitles((prev) => prev.filter((s) => s.summaryId !== entry.summaryId));
      if (openSummaryId === entry.id) {
        setOpenSummaryId(null);
        setOpenSummaryText(null);
      }
    } catch (err) {
      setDeleteSummaryError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setDeletingSummaryId(null);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const existingSemesters = Array.from(
    new Set(courses.map((c) => c.semester).filter((s): s is string => Boolean(s)))
  );
  const visibleDocuments = documents.filter((d) => d.courseId === selectedCourseId);

  const handleFileUpload = async (file: File) => {
    if (!selectedCourseId) return;

    const id = `${Date.now()}`;
    setDocuments((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        uploadedLabel: "just now",
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

  const handleRemove = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
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

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {isLoadingCourses ? (
          <div className="flex h-full min-h-[132px] items-center justify-center rounded-xl border border-panel-border bg-panel text-[12.5px] text-muted">
            Loading courses…
          </div>
        ) : coursesError ? (
          <div className="col-span-full rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-6 text-center text-[13px] text-rose">
            {coursesError}
          </div>
        ) : (
          courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`overflow-hidden rounded-xl border bg-panel text-left transition-colors ${
                course.id === selectedCourseId
                  ? "border-accent"
                  : "border-panel-border hover:border-accent"
              }`}
            >
              <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
              <div className="p-3">
                <p className="text-[13.5px] capitalize text-foreground">
                  {course.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {documents.filter((d) => d.courseId === course.id).length} documents
                </p>
              </div>
            </button>
          ))
        )}

        <AddCourseCard
          userId={CURRENT_UID}
          existingSemesters={existingSemesters}
          onCreated={(course) => {
            setCourses((prev) => [...prev, course]);
            setSelectedCourseId(course.id);
          }}
        />
      </div>

      {selectedCourse && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Upload material for <span className="capitalize">{selectedCourse.name}</span>
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

          {(isLoadingSummaryTitles || summaryTitlesError || summaryTitles.length > 0) && (
            <section className="mb-6">
              <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
                Saved Summaries
              </h2>
              {isLoadingSummaryTitles ? (
                <p className="text-[13px] text-muted">Loading…</p>
              ) : summaryTitlesError ? (
                <p className="text-[13px] text-rose">{summaryTitlesError}</p>
              ) : (
                <>
                  {deleteSummaryError && (
                    <p className="mb-1.5 text-[12px] text-rose">{deleteSummaryError}</p>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {summaryTitles.map((entry) => (
                    <li
                      key={entry.summaryId}
                      className="rounded-lg border border-panel-border bg-panel"
                    >
                      <div className="group flex items-center">
                        <button
                          onClick={() => handleOpenSavedSummary(entry.id)}
                          className="flex flex-1 items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
                        >
                          <FileIconLucide size={15} className="shrink-0 text-accent" />
                          <span className="flex-1 truncate">{entry.title || "Untitled"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSummary(entry)}
                          disabled={deletingSummaryId === entry.summaryId}
                          className="shrink-0 rounded p-1.5 mr-2 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 disabled:opacity-50"
                          aria-label="Delete summary"
                        >
                          {deletingSummaryId === entry.summaryId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>

                      {openSummaryId === entry.id && (
                        <div className="border-t border-panel-border px-3 py-2.5">
                          {isLoadingOpenSummary ? (
                            <p className="text-[12.5px] text-muted">Loading…</p>
                          ) : openSummaryError ? (
                            <p className="text-[12.5px] text-rose">{openSummaryError}</p>
                          ) : (
                            <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                              {openSummaryText}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium text-foreground font-serif">
                Study Plan
              </h2>
              <button
                onClick={() => setShowStudyPlanForm((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-strong)]"
              >
                <CalendarPlus size={13} />
                {studyPlanItems.length > 0 ? "Regenerate" : "Generate Study Plan"}
              </button>
            </div>

            {showStudyPlanForm && (
              <div className="mb-3 flex flex-col gap-2.5 rounded-xl border border-panel-border bg-panel p-3.5">
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
                    disabled={isGeneratingStudyPlan || !studyPlanStart || !studyPlanEnd}
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
              <ul className="flex flex-col gap-1.5">
                {studyPlanItems.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-panel-border bg-panel px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-foreground">
                        {item.taskName}
                      </p>
                      {(item.scheduledDate || item.startTime) && (
                        <span className="shrink-0 text-[11px] text-muted">
                          {item.scheduledDate} {item.startTime && `${item.startTime}–${item.endTime}`}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                    {item.location && (
                      <p className="mt-0.5 text-[11.5px] text-muted">{item.location}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
              Documents
            </h2>
            {visibleDocuments.length === 0 ? (
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
                      <span className="flex-1 truncate text-[13.5px] text-[var(--text-secondary)]">
                        {doc.name}
                      </span>
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
                        className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                        aria-label="Remove document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

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

                    {doc.downloadError && (
                      <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                        {doc.downloadError}
                      </p>
                    )}

                    {doc.summary && (
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

                    {doc.quiz && (
                      <div className="border-t border-panel-border px-3 py-3">
                        <p className="mb-2 text-[13px] font-medium text-foreground">
                          Quiz ({doc.quiz.flashcards.length} flashcards &middot;{" "}
                          {doc.quiz.mcq.length} MCQ &middot; {doc.quiz.openText.length} open text)
                        </p>

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
