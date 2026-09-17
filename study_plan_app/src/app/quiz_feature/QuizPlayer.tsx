"use client";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
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
} from "./quizCore";
import { preloadQuizSounds, playQuizSound } from "./quizSounds";
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

// The mode-select -> session flow, using the shared quiz sound module (see
// quizSounds.ts) for hover/mode-select/correct/finish sounds. Driven
// entirely by the caller's already-generated quiz for one document — there's
// no upload/paste step or question-count picker, every generated question is
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

  useEffect(() => {
    preloadQuizSounds();
  }, []);

  const playHoverTick = () => playQuizSound("hover", 0.7);
  const playCorrectSound = () => playQuizSound("correct", 1.35);

  const handleModeSelect = (mode: StudyMode) => {
    playQuizSound("modeSelect");
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
    if (result.total > 0 && result.passed === result.total) {
      // Both fire in the same tick, so they start together with no gap.
      playQuizSound("perfectA");
      playQuizSound("perfectB");
    } else {
      playQuizSound("finished");
    }
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
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div>
      )}
    </>
  );
}
