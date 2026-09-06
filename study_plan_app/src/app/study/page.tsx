"use client";
import { useState } from "react";
import {
  Menu,
  Upload,
  FileText,
  Eye,
  Ear,
  Repeat,
  Layers,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { useTheme, ThemeToggle, Sidebar } from "../shared_shell";

type StudyMode = "visual" | "auditive" | "repetitive" | "combination";

type ModeDef = {
  id: StudyMode;
  label: string;
  description: string;
  icon: LucideIcon;
};

const MODES: ModeDef[] = [
  {
    id: "visual",
    label: "Visual",
    description: "Diagrams, graphs, models",
    icon: Eye,
  },
  {
    id: "auditive",
    label: "Auditive",
    description: "Listen and speak",
    icon: Ear,
  },
  {
    id: "repetitive",
    label: "Repetitive",
    description: "Rewrite, flashcards, memory",
    icon: Repeat,
  },
  {
    id: "combination",
    label: "Combination",
    description: "All three",
    icon: Layers,
  },
];

// Platzhalter-Fragen, bis die echte KI-Generierung angebunden ist
// (TODO: durch createFlashcards()-Call ersetzen, siehe Groq-Integration)
const MOCK_QUESTIONS = [
  "What does photosynthesis mean?",
  "Which organelle carries out photosynthesis?",
  "What are the two main products of photosynthesis?",
  "What role does chlorophyll play?",
];

type Step = "select-mode" | "input" | "session";

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: ModeDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = mode.icon;
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-colors ${
        selected
          ? "border-accent bg-[var(--overlay-strong)]"
          : "border-panel-border bg-panel hover:bg-[var(--overlay)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          selected
            ? "bg-accent text-accent-foreground"
            : "bg-[var(--sunken)] text-muted"
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="text-[15px] font-medium text-foreground font-serif">
        {mode.label}
      </span>
      <span className="text-[12.5px] leading-snug text-muted">
        {mode.description}
      </span>
    </button>
  );
}

function InputMethodStep({
  onBack,
  onFileChosen,
  onTextPasted,
}: {
  onBack: () => void;
  onFileChosen: (fileName: string) => void;
  onTextPasted: (text: string) => void;
}) {
  const [pastedText, setPastedText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  return (
    <div className="mx-auto max-w-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-[12.5px] text-muted hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft size={14} />
        Change learning type
      </button>

      {!showPasteBox ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-panel-border bg-panel px-6 py-10 text-center transition-colors hover:border-accent">
            <Upload size={22} className="text-accent" />
            <span className="text-[13.5px] text-[var(--text-secondary)]">
              Upload document / lecture
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileChosen(file.name);
                // TODO: Datei tatsächlich hochladen (z.B. an app/api/upload)
                // und Text serverseitig extrahieren, statt nur den Namen zu zeigen.
              }}
            />
          </label>

          <button
            onClick={() => setShowPasteBox(true)}
            className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-panel-border bg-panel px-6 py-10 text-center transition-colors hover:bg-[var(--overlay)]"
          >
            <FileText size={22} className="text-accent" />
            <span className="text-[13.5px] text-[var(--text-secondary)]">
              Paste text
            </span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste your notes or lecture text here…"
            className="w-full resize-none rounded-lg border border-panel-border bg-[var(--sunken)] p-3 text-[13.5px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowPasteBox(false)}
              className="rounded-md border border-panel-border px-3 py-1.5 text-[12.5px] text-muted hover:bg-[var(--overlay)]"
            >
              Back
            </button>
            <button
              onClick={() => pastedText.trim() && onTextPasted(pastedText)}
              className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-accent-foreground hover:brightness-110"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionStep({
  mode,
  sourceLabel,
  onExit,
}: {
  mode: StudyMode;
  sourceLabel: string;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const total = MOCK_QUESTIONS.length;
  const progress = ((index + 1) / total) * 100;
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;

  const handleNext = () => {
    // TODO: Antwort serverseitig bewerten (z.B. via KI), statt nur weiterzuschalten
    setAnswer("");
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted">
          Mode: {modeLabel}
        </span>
      </div>

      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
        {sourceLabel}
      </p>
      <h2 className="mb-6 text-[19px] font-medium leading-snug text-foreground font-serif">
        {MOCK_QUESTIONS[index]}
      </h2>

      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleNext()}
        placeholder="Type your answer…"
        className="mb-4 w-full rounded-lg border border-panel-border bg-[var(--sunken)] px-3 py-2.5 text-[13.5px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">
          Question {index + 1}/{total}
        </span>
        <button
          onClick={handleNext}
          disabled={index === total - 1 && answer === ""}
          className="rounded-full bg-accent px-4 py-1.5 text-[12.5px] font-medium text-accent-foreground hover:brightness-110 disabled:opacity-40"
        >
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default function StudyPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>("select-mode");
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");

  const handleModeSelect = (mode: StudyMode) => {
    setSelectedMode(mode);
    setStep("input");
  };

  const handleFileChosen = (fileName: string) => {
    setSourceLabel(fileName);
    setStep("session");
  };

  const handleTextPasted = () => {
    setSourceLabel("Pasted text");
    setStep("session");
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

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-8">
          {step === "select-mode" && (
            <>
              <h1 className="mb-8 text-center text-[24px] font-medium tracking-tight text-foreground font-serif sm:text-[28px]">
                Hello <span className="text-[var(--accent-strong)]">Manar</span>,
                how would you like to study?
              </h1>
              <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                {MODES.map((mode) => (
                  <ModeCard
                    key={mode.id}
                    mode={mode}
                    selected={selectedMode === mode.id}
                    onSelect={() => handleModeSelect(mode.id)}
                  />
                ))}
              </div>
            </>
          )}

          {step === "input" && selectedMode && (
            <InputMethodStep
              onBack={() => setStep("select-mode")}
              onFileChosen={handleFileChosen}
              onTextPasted={handleTextPasted}
            />
          )}

          {step === "session" && selectedMode && (
            <SessionStep
              mode={selectedMode}
              sourceLabel={sourceLabel}
              onExit={() => setStep("select-mode")}
            />
          )}
        </main>
      </div>
    </div>
  );
}