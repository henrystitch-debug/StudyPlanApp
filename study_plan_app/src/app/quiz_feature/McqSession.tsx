"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { McqQuestion, SCORE_STYLES, ScoreCategory, classifyScore, isPassed, labelFor, setRetakeMarker } from "./quizCore";
import { CorrectBurst, RetakeMarkerDot, SessionCompletePanel } from "./QuizSharedUI";

export function McqSession({
  sourceLabel,
  bank,
  onExit,
  onCorrect,
  count,
}: {
  sourceLabel: string;
  bank: McqQuestion[];
  onExit: () => void;
  onCorrect: () => void;
  count: number;
}) {
  const questions = bank.slice(0, count);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<(ScoreCategory | null)[]>(Array(questions.length).fill(null));
  const total = questions.length;
  const isDone = index >= total;
  const progress = (Math.min(index, total) / total) * 100;
  const passed = results.filter(isPassed).length;

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
    const q = questions[index];
    const matches = q.options.filter((_, i) => selected.has(i) === q.correctIndices.includes(i)).length;
    const percent = (matches / q.options.length) * 100;
    const category = classifyScore(percent);
    if (category === "correct") onCorrect();
    setRetakeMarker("mcq", q.question, category);
    setResults((prev) => prev.map((r, i) => (i === index ? category : r)));
    setSubmitted(true);
  };

  const handleNext = () => {
    setSelected(new Set());
    setSubmitted(false);
    setIndex((i) => i + 1);
  };

  if (isDone) {
    return <SessionCompletePanel sourceLabel={sourceLabel} passed={passed} total={total} onExit={onExit} />;
  }

  const q = questions[index];
  const result = results[index];

  return (
    <div
      className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6"
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (submitted) handleNext();
        else handleSubmit();
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-[var(--text-secondary)]">
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] uppercase tracking-wider text-muted">
          Mode: {labelFor("mcq")}
        </span>
      </div>

      <div className="mb-1 flex items-center gap-1.5">
        <p className="text-[11.5px] uppercase tracking-wider text-muted">{sourceLabel}</p>
        <RetakeMarkerDot mode="mcq" questionKey={q.question} />
      </div>
      <h2 className="mb-4 text-[18px] font-medium leading-snug text-foreground font-serif">{q.question}</h2>

      <ul className="mb-4 flex flex-col gap-2">
        {q.options.map((option, i) => {
          const isKeyCorrect = submitted && q.correctIndices.includes(i);
          const isTicked = selected.has(i);
          return (
            <li key={i}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-[14px] text-[var(--text-secondary)] transition-colors ${
                  isTicked ? "border-accent bg-[var(--overlay-strong)]" : "border-panel-border bg-[var(--sunken)] hover:bg-[var(--overlay)]"
                } ${
                  isKeyCorrect
                    ? isTicked
                      ? "!border-solid !border-[var(--score-correct)]"
                      : "!border-dashed !border-[var(--score-correct)]"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleOption(i)}
                  disabled={submitted}
                  className="accent-accent"
                />
                {option}
              </label>
            </li>
          );
        })}
      </ul>

      {submitted && result ? (
        <div
          className={`relative mb-4 flex items-center justify-between overflow-visible rounded-md border px-3 py-2.5 ${SCORE_STYLES[result].border} ${SCORE_STYLES[result].bg}`}
        >
          {result === "correct" && <CorrectBurst />}
          <span className={`text-[13.5px] font-medium ${SCORE_STYLES[result].text}`}>{SCORE_STYLES[result].label}</span>
          <button
            onClick={handleNext}
            className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
          >
            {index === total - 1 ? "Finish" : "Next"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="mb-4 w-full rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
        >
          Submit
        </button>
      )}

      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
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
