"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Flashcard,
  SCORE_STYLES,
  ScoreCategory,
  classifyScore,
  isPassed,
  labelFor,
  normalizeWords,
  scoreFreeText,
  setRetakeMarker,
} from "./quizCore";
import { CorrectBurst, RetakeMarkerDot, ScoreGauge, SessionCompletePanel } from "./QuizSharedUI";

const SCAN_TOTAL_MS = 980; // fixed for every answer length — longer answers just get a faster per-word pace
const CURSOR_WIDTH = 30; // px — keep in sync with .scan-cursor's width in globals.css

// A small glass rectangle glides once, continuously, from the first word
// to the far right edge of the line (not hopping word by word, and not
// stopping short just because the last line doesn't fill the width),
// while the word highlights underneath still tick word-by-word as a
// "scanned" cue. The score is known immediately (scoreFreeText is
// deterministic): onScored fires right away for bookkeeping (recording
// the result, retake marker), and onReveal fires in the same instant with
// the glide's own duration, so the gauge's rise runs in lockstep with the
// glide the whole way — same start, same finish, same accelerate/decelerate
// shape (see ScoreGauge's transition-timing-function). onFinished fires
// once the glide has actually completed.
function FreeTextScan({
  answer,
  idealAnswer,
  onScored,
  onReveal,
  onFinished,
}: {
  answer: string;
  idealAnswer: string;
  onScored: (finalPercent: number) => void;
  onReveal: (finalPercent: number, durationMs: number) => void;
  onFinished: () => void;
}) {
  const rawWords = answer.split(/\s+/).filter(Boolean);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cursorRect, setCursorRect] = useState<{ left: number; top: number; height: number; slideMs: number } | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hitIndices, setHitIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const finalPercent = scoreFreeText(answer, idealAnswer);
    if (rawWords.length === 0) {
      onScored(finalPercent);
      onReveal(finalPercent, 0);
      onFinished();
      return;
    }

    const idealWordSet = new Set(normalizeWords(idealAnswer));
    const hitFlags = rawWords.map((w) => normalizeWords(w).some((nw) => idealWordSet.has(nw)));
    const slideMs = SCAN_TOTAL_MS;
    const stepMs = slideMs / rawWords.length;

    // The score is known now, and the gauge rises in lockstep with the
    // glide itself (same duration, same easing — see ScoreGauge's
    // transition-timing-function) rather than being revealed separately.
    onScored(finalPercent);
    onReveal(finalPercent, slideMs);

    const container = containerRef.current;
    const firstEl = wordRefs.current[0];
    const lastEl = wordRefs.current[rawWords.length - 1];
    if (container && firstEl) {
      const containerBox = container.getBoundingClientRect();
      const firstBox = firstEl.getBoundingClientRect();
      const lastBox = (lastEl ?? firstEl).getBoundingClientRect();
      const paddingRight = parseFloat(getComputedStyle(container).paddingRight) || 0;
      // Height spans from the top of the first line to the bottom of the
      // last — on wrapped, multi-line answers the glass becomes a tall
      // rectangle covering every line at once (same fixed width) instead
      // of hopping vertically between lines. top/height are set once and
      // never animated; only left glides, left to right.
      const top = firstBox.top - containerBox.top;
      const height = lastBox.bottom - firstBox.top;
      // On wrapped, multi-line answers the glide runs to the far right
      // edge of the box, not just to wherever the last word ends — earlier
      // lines already reach full width, so a short last line should still
      // read as "scanned all the way across". A single-line answer has no
      // such earlier line to justify that, so it only glides over the
      // actual text — sliding across trailing empty space would look wrong.
      const isMultiLine = Math.round(lastBox.top) > Math.round(firstBox.top);
      const endLeft = isMultiLine
        ? containerBox.width - paddingRight - CURSOR_WIDTH
        : lastBox.right - containerBox.left;
      // Place the glass at the start with no transition, let that paint,
      // then kick off one continuous glide to the end — two rAFs so the
      // browser commits the start position before the target changes.
      setCursorRect({ left: firstBox.left - containerBox.left, top, height, slideMs });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCursorRect({ left: endLeft, top, height, slideMs });
        });
      });
    }

    let cancelled = false;
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      if (i >= rawWords.length) return;
      setActiveIndex(i);
      if (hitFlags[i]) {
        setHitIndices((prev) => new Set(prev).add(i));
      }
      i += 1;
      setTimeout(tick, stepMs);
    };
    tick();

    const finishTimer = setTimeout(onFinished, slideMs);

    return () => {
      cancelled = true;
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, idealAnswer]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-md border border-panel-border bg-[var(--sunken)] p-3 text-[14px] leading-relaxed text-[var(--text-secondary)]"
    >
      {cursorRect && (
        <span
          className="scan-cursor"
          style={
            {
              left: cursorRect.left,
              top: cursorRect.top,
              height: cursorRect.height,
              "--scan-slide-ms": `${cursorRect.slideMs}ms`,
            } as React.CSSProperties
          }
        />
      )}
      {rawWords.map((w, i) => (
        <span
          key={i}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          className={`scan-word ${i === activeIndex ? "scan-word-active" : ""} ${hitIndices.has(i) ? "scan-word-hit" : ""}`}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export function FreeTextSession({
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
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [gaugeDurationMs, setGaugeDurationMs] = useState(900);
  const [results, setResults] = useState<(ScoreCategory | null)[]>(Array(cards.length).fill(null));
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const pendingCorrectRef = useRef(false);
  const total = cards.length;
  const isDone = index >= total;
  const progress = (Math.min(index, total) / total) * 100;
  const passed = results.filter(isPassed).length;

  const handleSubmit = () => {
    setSubmitted(true);
    setScanning(true);
    setPercent(0);
  };

  // The score is known the instant scanning starts (scoreFreeText is
  // deterministic): bookkeeping happens right away, and handleReveal (see
  // FreeTextScan/onReveal) starts the gauge rising in that same instant,
  // with the glide's own duration, so the needle's climb runs in lockstep
  // with the glass window the whole way. Only the "correct" celebration
  // waits for the gauge to actually settle (see handleGaugeSettled) —
  // showing it before the gauge visibly reflects the score would read as
  // premature.
  const handleScored = (finalPercent: number) => {
    const category = classifyScore(finalPercent);
    pendingCorrectRef.current = category === "correct";
    setRetakeMarker("freetext", cards[index].question, category);
    setResults((prev) => prev.map((r, i) => (i === index ? category : r)));
  };

  const handleReveal = (finalPercent: number, durationMs: number) => {
    setPercent(finalPercent);
    setGaugeDurationMs(durationMs);
  };

  const handleScanFinished = () => {
    setScanning(false);
  };

  const handleGaugeSettled = () => {
    if (pendingCorrectRef.current) {
      pendingCorrectRef.current = false;
      onCorrect();
      setShowCorrectEffect(true);
    }
  };

  const handleNext = () => {
    setAnswer("");
    setSubmitted(false);
    setScanning(false);
    setPercent(0);
    setShowCorrectEffect(false);
    pendingCorrectRef.current = false;
    setIndex((i) => i + 1);
  };

  if (isDone) {
    return <SessionCompletePanel sourceLabel={sourceLabel} passed={passed} total={total} onExit={onExit} />;
  }

  const card = cards[index];
  const result = results[index];

  return (
    <div
      className="mx-auto max-w-xl rounded-2xl border border-panel-border bg-panel p-6"
      onKeyDown={(e) => {
        if (e.key === "Enter" && submitted && !scanning) {
          e.preventDefault();
          handleNext();
        }
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-[var(--text-secondary)]">
          <ArrowLeft size={14} />
          Exit session
        </button>
        <span className="rounded-full border border-panel-border bg-[var(--overlay)] px-2.5 py-1 text-[11.5px] uppercase tracking-wider text-muted">
          Mode: {labelFor("freetext")}
        </span>
      </div>

      <div className="mb-1 flex items-center gap-1.5">
        <p className="text-[11.5px] uppercase tracking-wider text-muted">{sourceLabel}</p>
        <RetakeMarkerDot mode="freetext" questionKey={card.question} />
      </div>
      <h2 className="mb-4 text-[18px] font-medium leading-snug text-foreground font-serif">{card.question}</h2>

      {submitted ? (
        <div className="mb-4 flex flex-col gap-3">
          {scanning ? (
            <FreeTextScan
              answer={answer}
              idealAnswer={card.answer}
              onScored={handleScored}
              onReveal={handleReveal}
              onFinished={handleScanFinished}
            />
          ) : (
            <div className="w-full rounded-md border border-panel-border bg-[var(--sunken)] p-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {answer}
            </div>
          )}

          <div className="flex items-start gap-5">
            <div className="flex flex-shrink-0 flex-col items-center gap-2">
              <ScoreGauge
                percent={percent}
                durationMs={gaugeDurationMs}
                easing="cubic-bezier(0.42, 0, 0.58, 1)"
                onSettled={handleGaugeSettled}
              />
              {!scanning && result && (
                <span
                  className={`relative overflow-visible rounded-full border px-3 py-1 text-[12.5px] font-medium ${SCORE_STYLES[result].border} ${SCORE_STYLES[result].bg} ${SCORE_STYLES[result].text}`}
                >
                  {showCorrectEffect && <CorrectBurst />}
                  {SCORE_STYLES[result].label}
                </span>
              )}
            </div>
            {!scanning && (
              <p className="flex-1 text-left text-[13px] leading-loose text-muted">
                Ideal answer:
                <br />
                <br />
                <span className="text-[var(--score-correct)]">{card.answer}</span>
              </p>
            )}
          </div>
          {!scanning && (
            <button
              onClick={handleNext}
              className="rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
            >
              {index === total - 1 ? "Finish" : "Next"}
            </button>
          )}
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
            rows={4}
            placeholder="Type your answer… (Enter to submit, Shift+Enter for a new line)"
            className="mb-4 w-full resize-none rounded-md border border-panel-border bg-[var(--sunken)] p-3 text-[14px] text-[var(--text-secondary)] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={() => answer.trim() && handleSubmit()}
            disabled={!answer.trim()}
            className="mb-4 w-full rounded-full border border-panel-border bg-[var(--overlay-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay)] disabled:opacity-40"
          >
            Submit
          </button>
        </>
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
