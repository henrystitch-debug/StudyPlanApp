"use client";
import { useState } from "react";
import {
  Upload,
  File as FileIconLucide,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  FileDown,
  Copy,
  Check,
} from "lucide-react";
import jsPDF from "jspdf";

type DocumentSummary = {
  title: string;
  summary: string;
};

type SubjectDocument = {
  id: string;
  name: string;
  uploadedLabel: string;
  file: File; // wird für den Summary-Request an den Server gebraucht
  summary?: DocumentSummary;
  isSummarizing?: boolean;
  summaryError?: string;
};

// TODO: "art" ist aktuell das einzige, fest codierte Fach. Sobald mehrere
// Fächer aus der Datenbank kommen (Subject.findMany), wird daraus eine
// echte Liste statt einer einzelnen Konstante.
const SUBJECT_NAME = "art";

function AddCourseCard() {
  // TODO: Mockup ohne Funktion – hier später ein Modal/Formular öffnen,
  // das POST /api/subjects aufruft und ein neues Fach anlegt.
  return (
    <button
      onClick={() => console.log("TODO: neues Fach anlegen")}
      className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] text-muted transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-secondary)]"
    >
      <Plus size={18} />
      <span className="text-[12.5px]">Add course</span>
    </button>
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

export default function SubjectsPage() {
  const [documents, setDocuments] = useState<SubjectDocument[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setDocuments((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: file.name,
        uploadedLabel: "just now",
        file,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
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
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isSummarizing: true, summaryError: undefined } : d
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", doc.file);

      const response = await fetch("/api/summary/summaryCreate", {
        method: "POST",
        body: formData,
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
                summary: { title: data.title, summary: data.summary },
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

  return (
    <>
      <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        Your Courses
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div className="overflow-hidden rounded-xl border border-panel-border bg-panel">
          <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
          <div className="p-3">
            <p className="text-[13.5px] capitalize text-foreground">
              {SUBJECT_NAME}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {documents.length} documents
            </p>
          </div>
        </div>

        <AddCourseCard />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-[15px] font-medium text-foreground font-serif">
          Upload material for <span className="capitalize">{SUBJECT_NAME}</span>
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
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
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
                    {doc.uploadedLabel}
                  </span>

                  <button
                    onClick={() => handleGenerateSummary(doc.id)}
                    disabled={doc.isSummarizing}
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
                    onClick={() => handleRemove(doc.id)}
                    className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                    aria-label="Remove document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {doc.summaryError && (
                  <p className="border-t border-panel-border px-3 py-2 text-[12px] text-rose">
                    {doc.summaryError}
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
                      rows={8}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full resize-y rounded-md border border-panel-border bg-[var(--sunken)] p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}