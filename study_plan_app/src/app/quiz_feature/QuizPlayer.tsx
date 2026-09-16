"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { Flashcard, MAX_QUESTIONS, McqQuestion, MIN_QUESTIONS, MODES, StudyMode, Step, labelFor } from "./quizCore";
import { ModeCard, CountStep } from "./QuizSetupSteps";
import { FlashcardSession } from "./FlashcardSession";
import { McqSession } from "./McqSession";
import { FreeTextSession } from "./FreeTextSession";
import { CombinationSession } from "./CombinationSession";

export type QuizPlayerData = {
  flashcards: Flashcard[];
  mcq: McqQuestion[];
  openText: Flashcard[];
};

// Auditive mode has no real interaction built yet — a plain typed-answer
// placeholder, same shape as the other modes used to be before they were
// built out for real. Reuses the document's own flashcard questions as
// prompts rather than a separate mock bank.
function AuditivePlaceholder({
  sourceLabel,
  prompts,
  onExit,
  count,
}: {
  sourceLabel: string;
  prompts: string[];
  onExit: () => void;
  count: number;
}) {
  const questions = prompts.slice(0, count);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const total = questions.length;
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
      <h2 className="mb-6 text-[19px] font-medium leading-snug text-foreground font-serif">{questions[index]}</h2>

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

// The mode-select -> count -> session flow, plus the shared Web Audio setup
// (hover/click/correct sounds) used across every step. Driven entirely by
// the caller's already-generated quiz for one document — there's no
// upload/paste step here, the source is already fixed.
export function QuizPlayer({ sourceLabel, quiz }: { sourceLabel: string; quiz: QuizPlayerData }) {
  const [step, setStep] = useState<Step>("select-mode");
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [questionCount, setQuestionCount] = useState(MIN_QUESTIONS);

  const availableCount = useMemo(() => {
    const combinableTotal = quiz.flashcards.length + quiz.mcq.length + quiz.openText.length;
    const counts: Record<StudyMode, number> = {
      flashcards: quiz.flashcards.length,
      mcq: quiz.mcq.length,
      freetext: quiz.openText.length,
      auditive: quiz.flashcards.length,
      combination: combinableTotal > 0 ? MAX_QUESTIONS : 0,
    };
    return counts;
  }, [quiz]);

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
    if (availableCount[mode] === 0) return;
    playClickSound();
    setSelectedMode(mode);
    setQuestionCount(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, availableCount[mode])));
    // Hold the selection frame briefly before morphing into the next screen.
    setTimeout(() => {
      const startViewTransition = (
        document as Document & { startViewTransition?: (cb: () => void) => void }
      ).startViewTransition?.bind(document);
      if (startViewTransition) startViewTransition(() => flushSync(() => setStep("select-count")));
      else setStep("select-count");
    }, 300);
  };

  const exitToModeSelect = () => setStep("select-mode");

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

      {step === "select-count" && selectedMode && (
        <CountStep
          modeLabel={labelFor(selectedMode) ?? ""}
          count={questionCount}
          onCountChange={setQuestionCount}
          onBack={exitToModeSelect}
          onContinue={() => setStep("session")}
          min={Math.min(MIN_QUESTIONS, availableCount[selectedMode])}
          max={Math.min(MAX_QUESTIONS, availableCount[selectedMode])}
        />
      )}

      {step === "session" && selectedMode === "flashcards" && (
        <FlashcardSession sourceLabel={sourceLabel} bank={quiz.flashcards} onExit={exitToModeSelect} onCorrect={playCorrectSound} count={questionCount} />
      )}

      {step === "session" && selectedMode === "mcq" && (
        <McqSession sourceLabel={sourceLabel} bank={quiz.mcq} onExit={exitToModeSelect} onCorrect={playCorrectSound} count={questionCount} />
      )}

      {step === "session" && selectedMode === "freetext" && (
        <FreeTextSession sourceLabel={sourceLabel} bank={quiz.openText} onExit={exitToModeSelect} onCorrect={playCorrectSound} count={questionCount} />
      )}

      {step === "session" && selectedMode === "combination" && (
        <CombinationSession
          sourceLabel={sourceLabel}
          banks={{ flashcards: quiz.flashcards, mcq: quiz.mcq, freetext: quiz.openText }}
          onExit={exitToModeSelect}
          onCorrect={playCorrectSound}
          count={questionCount}
        />
      )}

      {step === "session" && selectedMode === "auditive" && (
        <AuditivePlaceholder
          sourceLabel={sourceLabel}
          prompts={quiz.flashcards.map((f) => f.question)}
          onExit={exitToModeSelect}
          count={questionCount}
        />
      )}
    </>
  );
}
