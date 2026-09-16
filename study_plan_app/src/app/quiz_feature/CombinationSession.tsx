"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  COMBINABLE_MODES,
  Flashcard,
  McqQuestion,
  SCORE_STYLES,
  ScoreCategory,
  StudyMode,
  classifyScore,
  isPassed,
  labelFor,
  scoreFreeText,
  setRetakeMarker,
} from "./quizCore";
import { CorrectBurst, RetakeMarkerDot, ScoreGauge, SessionCompletePanel } from "./QuizSharedUI";

type CombinationBanks = {
  flashcards: Flashcard[];
  mcq: McqQuestion[];
  freetext: Flashcard[];
};

// Only offers modes whose bank actually has content — a document with no
// generated MCQ, say, should never have combination silently try to draw
// from an empty array.
function availableModes(banks: CombinationBanks): (typeof COMBINABLE_MODES)[number][] {
  return COMBINABLE_MODES.filter((mode) => banks[mode === "freetext" ? "freetext" : mode].length > 0);
}

// One question, rendered differently depending on the mode randomly
// assigned to this slot. Simpler than the dedicated single-mode sessions
// (e.g. Free Text here skips the word-by-word scan) since this has to
// smoothly switch shape every question.
function CombinationQuestion({
  mode,
  banks,
  onDone,
  onCorrect,
}: {
  mode: StudyMode;
  banks: CombinationBanks;
  onDone: (category: ScoreCategory) => void;
  onCorrect: () => void;
}) {
  if (mode === "flashcards") return <CombinationFlashcard bank={banks.flashcards} onDone={onDone} onCorrect={onCorrect} />;
  if (mode === "mcq") return <CombinationMcq bank={banks.mcq} onDone={onDone} onCorrect={onCorrect} />;
  return <CombinationFreeText bank={banks.freetext} onDone={onDone} onCorrect={onCorrect} />;
}

function CombinationFlashcard({
  bank,
  onDone,
  onCorrect,
}: {
  bank: Flashcard[];
  onDone: (category: ScoreCategory) => void;
  onCorrect: () => void;
}) {
  const [card] = useState(() => bank[Math.floor(Math.random() * bank.length)]);
  const [flipped, setFlipped] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const handleRate = (rating: ScoreCategory) => {
    if (rating !== "correct") {
      onDone(rating);
      return;
    }
    onCorrect();
    setCelebrating(true);
    setTimeout(() => onDone(rating), 550);
  };

  return (
    <div onKeyDown={(e) => e.key === "Enter" && !flipped && setFlipped(true)}>
      <p className="mb-1.5 text-[11px] uppercase tracking-wider text-accent">Flashcard</p>
      <div style={{ perspective: "1200px" }}>
        <div
          onClick={() => setFlipped((f) => !f)}
          className="flashcard-flip relative h-44 w-full cursor-pointer"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
        >
          <div className="flashcard-face absolute inset-0 flex items-center justify-center rounded-lg border border-panel-border bg-[var(--sunken)] p-6 text-center">
            <p className="text-[17px] font-medium leading-snug text-foreground font-serif">{card.question}</p>
          </div>
          <div className="flashcard-face flashcard-face-back absolute inset-0 flex items-center justify-center rounded-lg border border-accent/40 bg-[var(--overlay)] p-6 text-center">
            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">{card.answer}</p>
          </div>
        </div>
      </div>

      {!flipped ? (
        <p className="mt-3 text-center text-[12.5px] text-muted">Click the card to reveal the answer</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["correct", "partly", "false"] as ScoreCategory[]).map((rating) => {
            const style = SCORE_STYLES[rating];
            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                disabled={celebrating}
                className={`relative overflow-visible rounded-md border px-2 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-default ${style.border} ${style.bg} ${style.text} hover:brightness-110`}
              >
                {celebrating && rating === "correct" && <CorrectBurst />}
                <span className="relative">{style.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CombinationMcq({
  bank,
  onDone,
  onCorrect,
}: {
  bank: McqQuestion[];
  onDone: (category: ScoreCategory) => void;
  onCorrect: () => void;
}) {
  const [q] = useState(() => bank[Math.floor(Math.random() * bank.length)]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ScoreCategory | null>(null);

  const toggleOption = (i: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    const matches = q.options.filter((_, i) => selected.has(i) === q.correctIndices.includes(i)).length;
    const category = classifyScore((matches / q.options.length) * 100);
    if (category === "correct") onCorrect();
    setResult(category);
    setSubmitted(true);
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (submitted) onDone(result as ScoreCategory);
        else handleSubmit();
      }}
    >
      <p className="mb-1.5 text-[11px] uppercase tracking-wider text-accent">Multiple Choice</p>
      <h3 className="mb-3 text-[16px] font-medium leading-snug text-foreground font-serif">{q.question}</h3>
      <ul className="mb-3 flex flex-col gap-2">
        {q.options.map((option, i) => {
          const isKeyCorrect = submitted && q.correctIndices.includes(i);
          const isTicked = selected.has(i);
          return (
            <li key={i}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-[13.5px] text-[var(--text-secondary)] transition-colors ${
                  isTicked ? "border-accent bg-[var(--overlay-strong)]" : "border-panel-border bg-[var(--sunken)] hover:bg-[var(--overlay)]"
                } ${
                  isKeyCorrect
                    ? isTicked
                      ? "!border-solid !border-[var(--score-correct)]"
                      : "!border-dashed !border-[var(--score-correct)]"
                    : ""
                }`}
              >
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleOption(i)} disabled={submitted} className="accent-accent" />
                {option}
              </label>
            </li>
          );
        })}
      </ul>

      {submitted && result ? (
        <div
          className={`relative flex items-center justify-between overflow-visible rounded-md border px-3 py-2.5 ${SCORE_STYLES[result].border} ${SCORE_STYLES[result].bg}`}
        >
          {result === "correct" && <CorrectBurst />}
          <span className={`text-[13.5px] font-medium ${SCORE_STYLES[result].text}`}>{SCORE_STYLES[result].label}</span>
          <button
            onClick={() => onDone(result)}
            className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
          >
            Next
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="w-full rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
        >
          Submit
        </button>
      )}
    </div>
  );
}

function CombinationFreeText({
  bank,
  onDone,
  onCorrect,
}: {
  bank: Flashcard[];
  onDone: (category: ScoreCategory) => void;
  onCorrect: () => void;
}) {
  const [card] = useState(() => bank[Math.floor(Math.random() * bank.length)]);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState<ScoreCategory | null>(null);

  const handleSubmit = () => {
    const score = scoreFreeText(answer, card.answer);
    const category = classifyScore(score);
    if (category === "correct") onCorrect();
    setPercent(score);
    setResult(category);
    setSubmitted(true);
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && submitted) {
          e.preventDefault();
          onDone(result as ScoreCategory);
        }
      }}
    >
      <p className="mb-1.5 text-[11px] uppercase tracking-wider text-accent">Free Text</p>
      <h3 className="mb-3 text-[16px] font-medium leading-snug text-foreground font-serif">{card.question}</h3>

      {submitted ? (
        <div className="flex flex-col gap-3">
          <div className="w-full rounded-md border border-panel-border bg-[var(--sunken)] p-3 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
            {answer}
          </div>
          <div className="flex items-start gap-5">
            <div className="flex flex-shrink-0 flex-col items-center gap-2">
              <ScoreGauge percent={percent} />
              {result && (
                <span
                  className={`relative overflow-visible rounded-full border px-3 py-1 text-[12.5px] font-medium ${SCORE_STYLES[result].border} ${SCORE_STYLES[result].bg} ${SCORE_STYLES[result].text}`}
                >
                  {result === "correct" && <CorrectBurst />}
                  {SCORE_STYLES[result].label}
                </span>
              )}
            </div>
            <p className="flex-1 text-left text-[12.5px] leading-loose text-muted">
              Ideal answer:
              <br />
              <br />
              <span className="text-[var(--score-correct)]">{card.answer}</span>
            </p>
          </div>
          <button
            onClick={() => onDone(result as ScoreCategory)}
            className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
          >
            Next
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (answer.trim()) handleSubmit();
              }
            }}
            rows={3}
            placeholder="Type your answer… (Enter to submit, Shift+Enter for a new line)"
            className="mb-3 w-full resize-none rounded-md border border-panel-border bg-[var(--sunken)] p-3 text-[13.5px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={() => answer.trim() && handleSubmit()}
            disabled={!answer.trim()}
            className="w-full rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)] disabled:opacity-40"
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
}

export function CombinationSession({
  sourceLabel,
  banks,
  onExit,
  onCorrect,
  count,
}: {
  sourceLabel: string;
  banks: CombinationBanks;
  onExit: () => void;
  onCorrect: () => void;
  count: number;
}) {
  const modes = availableModes(banks);
  const pickRandomMode = () => modes[Math.floor(Math.random() * modes.length)];
  const [modeSequence] = useState<StudyMode[]>(() => Array.from({ length: count }, pickRandomMode));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(ScoreCategory | null)[]>(Array(count).fill(null));
  const total = count;
  const isDone = index >= total;
  const progress = (Math.min(index, total) / total) * 100;
  const passed = results.filter(isPassed).length;

  const handleQuestionDone = (category: ScoreCategory) => {
    setRetakeMarker("combination", `${modeSequence[index]}:${index}`, category);
    setResults((prev) => prev.map((r, i) => (i === index ? category : r)));
    setIndex((i) => i + 1);
  };

  if (isDone) {
    return <SessionCompletePanel sourceLabel={sourceLabel} passed={passed} total={total} onExit={onExit} />;
  }

  const currentMode = modeSequence[index];

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-[var(--text-secondary)]">
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] uppercase tracking-wider text-muted">
          Mode: {labelFor("combination")}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-1.5">
        <p className="text-[11.5px] uppercase tracking-wider text-muted">{sourceLabel}</p>
        <RetakeMarkerDot mode="combination" questionKey={`${currentMode}:${index}`} />
      </div>

      <CombinationQuestion key={index} mode={currentMode} banks={banks} onDone={handleQuestionDone} onCorrect={onCorrect} />

      <div className="mb-2 mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-muted">
          Question {index + 1}/{total}
        </span>
        <span className="text-[11.5px] text-muted">{passed} passed</span>
      </div>
    </div>
  );
}
