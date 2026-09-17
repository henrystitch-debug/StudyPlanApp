"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft } from "lucide-react";
import {
  AnsweredQuestion,
  Flashcard,
  McqQuestion,
  MODES,
  ModeAttempt,
  QuizIds,
  StudyMode,
  Step,
  groupAnsweredByMode,
  labelFor,
} from "./quizCore";
import { ModeCard } from "./QuizSetupSteps";
import { FlashcardSession } from "./FlashcardSession";
import { McqSession } from "./McqSession";
import { FreeTextSession } from "./FreeTextSession";
import { CombinationSession } from "./CombinationSession";

export type QuizPlayerData = {
  flashcards: Flashcard[];
  mcq: McqQuestion[];
  openText: Flashcard[];
  quizIds: QuizIds;
};

export type QuizSessionResult = {
  passed: number;
  total: number;
  answered: AnsweredQuestion[];
  attempts: ModeAttempt[];
};

// Auditive mode has no real interaction built yet — a plain typed-answer
// placeholder, same shape as the other modes used to be before they were
// built out for real. Reuses the document's own flashcard questions as
// prompts rather than a separate mock bank.
function AuditivePlaceholder({
  sourceLabel,
  prompts,
  onExit,
}: {
  sourceLabel: string;
  prompts: string[];
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const total = prompts.length;

  if (total === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6 text-center">
        <p className="mb-4 text-[13px] text-muted">No questions available for auditive mode.</p>
        <button
          onClick={onExit}
          className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
        >
          Back
        </button>
      </div>
    );
  }

  const progress = ((index + 1) / total) * 100;

  const handleNext = () => {
    setAnswer("");
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-[var(--text-secondary)]">
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted">
          Mode: {labelFor("auditive")}
        </span>
      </div>

      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">{sourceLabel}</p>
      <h2 className="mb-6 text-[19px] font-medium leading-snug text-foreground font-serif">{prompts[index]}</h2>

      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleNext()}
        placeholder="Type your answer…"
        className="mb-4 w-full rounded-md border border-panel-border bg-[var(--sunken)] px-3 py-2.5 text-[13.5px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">
          Question {index + 1}/{total}
        </span>
        <button
          onClick={handleNext}
          disabled={index === total - 1 && answer === ""}
          className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)] disabled:opacity-40"
        >
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

// The mode-select -> session flow, plus the shared Web Audio setup
// (hover/click/correct sounds) used across every step. Driven entirely by
// the caller's already-generated quiz for one document — there's no
// upload/paste step or question-count picker, every generated question is
// used. When a session finishes, the score panel briefly zooms in place
// (see quiz-session-zoom in globals.css) before onSessionComplete hands the
// result up to the caller, which is expected to close this player's host
// panel and present the score on its own (the "slam" landing).
export function QuizPlayer({
  sourceLabel,
  quiz,
  onSessionComplete,
}: {
  sourceLabel: string;
  quiz: QuizPlayerData;
  onSessionComplete?: (result: QuizSessionResult) => void;
}) {
  const [step, setStep] = useState<Step>("select-mode");
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [zooming, setZooming] = useState(false);

  // Web Audio API: buffers are decoded once and played via fresh
  // AudioBufferSourceNodes so rapid re-triggers never cut each other off.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const hoverBufferRef = useRef<AudioBuffer | null>(null);
  const clickBufferRef = useRef<AudioBuffer | null>(null);
  const correctBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    audioCtxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    const buffers: [string, React.RefObject<AudioBuffer | null>][] = [
      ["/sounds/subtle_blob.wav", hoverBufferRef],
      ["/sounds/clickA.wav", clickBufferRef],
      ["/sounds/Correct1.wav", correctBufferRef],
    ];
    buffers.forEach(([url, ref]) => {
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => (ref.current = buffer))
        .catch((err) => console.warn(`[quiz] failed to load sound ${url}`, err));
    });

    // AudioContexts start suspended until a user gesture resumes them, and
    // browsers auto-suspend an idle context again later as a power-saving
    // measure — so this stays a persistent listener (not {once: true})
    // rather than a one-shot unlock, to recover from that too.
    const unlock = () => {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      ctx.close().catch(() => {});
    };
  }, []);

  const playBuffer = (buffer: AudioBuffer | null) => {
    const ctx = audioCtxRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !buffer || !gain) return;
    // Gating playback on resume() resolving first means any rejected
    // resume() (which happens more than you'd expect) drops the sound
    // entirely. A source scheduled at time 0 on a still-suspended context
    // is valid and plays once the context catches up, so just fire both.
    if (ctx.state === "suspended") ctx.resume().catch((err) => console.warn("[quiz] audio resume failed", err));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(0);
  };

  const playHoverTick = () => playBuffer(hoverBufferRef.current);
  const playClickSound = () => playBuffer(clickBufferRef.current);
  const playCorrectSound = () => playBuffer(correctBufferRef.current);

  const handleModeSelect = (mode: StudyMode) => {
    playClickSound();
    setSelectedMode(mode);
    // Hold the selection frame briefly before morphing into the next screen.
    setTimeout(() => {
      const startViewTransition = (
        document as Document & { startViewTransition?: (cb: () => void) => void }
      ).startViewTransition?.bind(document);
      if (startViewTransition) startViewTransition(() => flushSync(() => setStep("session")));
      else setStep("session");
    }, 300);
  };

  const exitToModeSelect = () => setStep("select-mode");

  // Briefly zooms the finished score panel in place (still inside the
  // host's expand panel), then hands the result up so the caller can close
  // that panel and present the score on its own — the "slam" landing.
  // Sessions only know their own flat answered list; attempts (grouped by
  // the real quiz_id each question belongs to) are computed here, since
  // only QuizPlayer has quiz.quizIds.
  const handleSessionFinished = (result: { passed: number; total: number; answered: AnsweredQuestion[] }) => {
    setZooming(true);
    setTimeout(() => {
      onSessionComplete?.({ ...result, attempts: groupAnsweredByMode(result.answered, quiz.quizIds) });
      setZooming(false);
      setStep("select-mode");
      setSelectedMode(null);
    }, 420);
  };

  return (
    <>
      {step === "select-mode" && (
        <>
          <h1 className="mb-8 text-center text-[24px] font-medium tracking-tight text-foreground font-serif sm:text-[28px]">
            <span className="text-[var(--accent-strong)]">{sourceLabel}</span> — how would you like to study?
          </h1>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {MODES.map((mode) => (
              <ModeCard
                key={mode.id}
                mode={mode}
                selected={selectedMode === mode.id}
                onSelect={() => handleModeSelect(mode.id)}
                onHover={playHoverTick}
              />
            ))}
          </div>
        </>
      )}

      {step === "session" && selectedMode && (
        <div className={zooming ? "quiz-session-zoom" : ""}>
          {selectedMode === "flashcards" && (
            <FlashcardSession
              sourceLabel={sourceLabel}
              bank={quiz.flashcards}
              onExit={exitToModeSelect}
              onCorrect={playCorrectSound}
              onFinished={handleSessionFinished}
            />
          )}

          {selectedMode === "mcq" && (
            <McqSession
              sourceLabel={sourceLabel}
              bank={quiz.mcq}
              onExit={exitToModeSelect}
              onCorrect={playCorrectSound}
              onFinished={handleSessionFinished}
            />
          )}

          {selectedMode === "freetext" && (
            <FreeTextSession
              sourceLabel={sourceLabel}
              bank={quiz.openText}
              onExit={exitToModeSelect}
              onCorrect={playCorrectSound}
              onFinished={handleSessionFinished}
            />
          )}

          {selectedMode === "combination" && (
            <CombinationSession
              sourceLabel={sourceLabel}
              banks={{ flashcards: quiz.flashcards, mcq: quiz.mcq, freetext: quiz.openText }}
              onExit={exitToModeSelect}
              onCorrect={playCorrectSound}
              onFinished={handleSessionFinished}
            />
          )}

          {selectedMode === "auditive" && (
            <AuditivePlaceholder
              sourceLabel={sourceLabel}
              prompts={quiz.flashcards.map((f) => f.question)}
              onExit={exitToModeSelect}
            />
          )}
        </div>
      )}
    </>
  );
}
