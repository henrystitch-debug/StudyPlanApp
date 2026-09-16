"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Flashcard,
  RATING_OPTIONS,
  SCORE_STYLES,
  ScoreCategory,
  isPassed,
  labelFor,
  setRetakeMarker,
} from "./quizCore";
import { CorrectBurst, RetakeMarkerDot, SessionCompletePanel } from "./QuizSharedUI";

export function FlashcardSession({
  sourceLabel,
  bank,
  onExit,
  onCorrect,
  count,
}: {
  sourceLabel: string;
  bank: Flashcard[];
  onExit: () => void;
  onCorrect: () => void;
  count: number;
}) {
  const cards = bank.slice(0, count);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [ratings, setRatings] = useState<(ScoreCategory | null)[]>(Array(cards.length).fill(null));
  const total = cards.length;
  const isDone = index >= total;
  const progress = (Math.min(index, total) / total) * 100;
  const passed = ratings.filter(isPassed).length;

  const commitRating = (rating: ScoreCategory) => {
    setRetakeMarker("flashcards", cards[index].question, rating);
    setRatings((prev) => prev.map((r, i) => (i === index ? rating : r)));
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const handleRate = (rating: ScoreCategory) => {
    if (rating !== "correct") {
      commitRating(rating);
      return;
    }
    onCorrect();
    setCelebrating(true);
    setTimeout(() => {
      setCelebrating(false);
      commitRating(rating);
    }, 550);
  };

  if (isDone) {
    return <SessionCompletePanel sourceLabel={sourceLabel} passed={passed} total={total} onExit={onExit} />;
  }

  const card = cards[index];

  return (
    <div
      className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !flipped) {
          e.preventDefault();
          setFlipped(true);
        }
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-[var(--text-secondary)]">
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] uppercase tracking-wider text-muted">
          Mode: {labelFor("flashcards")}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        <p className="text-[11.5px] uppercase tracking-wider text-muted">{sourceLabel}</p>
        <RetakeMarkerDot mode="flashcards" questionKey={card.question} />
      </div>

      <div style={{ perspective: "1200px" }}>
        <div
          onClick={() => setFlipped((f) => !f)}
          className="flashcard-flip relative h-52 w-full cursor-pointer"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
        >
          <div className="flashcard-face absolute inset-0 flex items-center justify-center rounded-lg border border-panel-border bg-[var(--sunken)] p-6 text-center">
            <p className="text-[18px] font-medium leading-snug text-foreground font-serif">{card.question}</p>
          </div>
          <div className="flashcard-face flashcard-face-back absolute inset-0 flex items-center justify-center rounded-lg border border-accent/40 bg-[var(--overlay)] p-6 text-center">
            <p className="text-[16px] leading-relaxed text-[var(--text-secondary)]">{card.answer}</p>
          </div>
        </div>
      </div>

      {!flipped ? (
        <p className="mb-2 mt-3 text-center text-[12.5px] text-muted">Click the card to reveal the answer</p>
      ) : (
        <div className="mb-2 mt-3 grid grid-cols-3 gap-2">
          {RATING_OPTIONS.map((rating) => {
            const style = SCORE_STYLES[rating];
            const isCelebratingHere = celebrating && rating === "correct";
            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                disabled={celebrating}
                className={`relative overflow-visible rounded-md border px-2 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-default ${style.border} ${style.bg} ${style.text} hover:brightness-110`}
              >
                {isCelebratingHere && <CorrectBurst />}
                <span className="relative">{style.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-2 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-muted">
          Card {index + 1}/{total}
        </span>
        <span className="text-[11.5px] text-muted">{passed} passed</span>
      </div>
    </div>
  );
}
