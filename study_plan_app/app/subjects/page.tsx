"use client";
import { useState } from "react";
import { Menu, Upload, File as FileIconLucide, Trash2, Plus } from "lucide-react";
import { useTheme, ThemeToggle, Sidebar } from "../shared-shell";

type SubjectDocument = {
  id: string;
  name: string;
  uploadedLabel: string;
};

// TODO: "art" ist aktuell das einzige, fest codierte Fach. Sobald mehrere
// Fächer aus der Datenbank kommen (Subject.findMany), wird daraus eine
// echte Liste statt einer einzelnen Konstante.
const SUBJECT_NAME = "art";

function AddCourseCard() {
  // TODO: Mockup-Button ohne Funktion – hier später ein Modal/Formular
  // öffnen, das POST /api/subjects aufruft und ein neues Fach anlegt.
  return (
    <button
      onClick={() => console.log("TODO: neues Fach anlegen")}
      className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] text-muted transition-colors hover:border-accent hover:text-[var(--text-secondary)]"
    >
      <Plus size={18} />
      <span className="text-[12.5px]">Add course</span>
    </button>
  );
}

export default function SubjectsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [selected, setSelected] = useState(false);
  const [documents, setDocuments] = useState<SubjectDocument[]>([]);

  const handleFileUpload = (file: File) => {
    // TODO: Datei tatsächlich hochladen (z.B. an app/api/upload), dort Text
    // extrahieren und als Document-Eintrag in der Datenbank speichern.
    setDocuments((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: file.name,
        uploadedLabel: "just now",
      },
    ]);
  };

  const handleRemove = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <h1 className="mb-6 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
            Your Courses
          </h1>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <button
              onClick={() => setSelected(true)}
              className={`overflow-hidden rounded-xl border bg-panel text-left transition-colors ${
                selected
                  ? "border-accent"
                  : "border-panel-border hover:border-[var(--overlay-strong)]"
              }`}
            >
              <div className="h-20 w-full bg-gradient-to-br from-rose via-rose-500 to-[#2a1030]" />
              <div className="p-3">
                <p className="text-[13.5px] capitalize text-foreground">
                  {SUBJECT_NAME}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {documents.length} documents
                </p>
              </div>
            </button>

            <AddCourseCard />
          </div>

          {selected && (
            <>
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
        </main>
      </div>
    </div>
  );
}
