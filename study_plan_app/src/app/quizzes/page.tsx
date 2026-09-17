"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, ChevronDown, ListChecks, PenLine, SquareStack } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AnsweredQuestion, ScoreCategory } from "@/app/quiz_feature/quizCore";
import { ReviewRow } from "@/app/quiz_feature/QuizSharedUI";

type QuizMode = "flashcards" | "mcq" | "freetext";

type QuizOverviewRow = {
  quiz_id: number;
  quiz_type: QuizMode;
  upload_id: number;
  topic_title: string;
  course_id: number;
  course_title: string;
  attempt_count: string;
  average_score: string | null;
  best_score: string | null;
  last_attempted: string | null;
};

const MODE_LABELS: Record<QuizMode, string> = {
  flashcards: "Flashcards",
  mcq: "Multiple Choice",
  freetext: "Free Text",
};

const MODE_ICONS: Record<QuizMode, typeof SquareStack> = {
  flashcards: SquareStack,
  mcq: ListChecks,
  freetext: PenLine,
};

// Weighted by attempt count (average_score is already a per-quiz mean, so
// weighting by attempts before re-averaging keeps a heavily-repeated quiz
// from counting the same as one taken once).
function weightedAverage(rows: QuizOverviewRow[]): number | null {
  let totalWeight = 0;
  let totalScore = 0;
  for (const row of rows) {
    const attempts = Number(row.attempt_count);
    if (attempts === 0 || row.average_score === null) continue;
    totalWeight += attempts;
    totalScore += Number(row.average_score) * attempts;
  }
  return totalWeight > 0 ? totalScore / totalWeight : null;
}

function ScoreStat({ icon: Icon, label, score }: { icon: typeof SquareStack; label: string; score: number | null }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-panel-border bg-panel p-5">
      <Icon size={18} className="text-foreground" />
      <p className="text-[22px] font-medium text-[var(--accent-strong)] font-serif">
        {score !== null ? `${Math.round(score)}%` : "—"}
      </p>
      <p className="text-[11.5px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

export default function QuizzesPage() {
  const router = useRouter();
  const { userId, isAuthed } = useAuth();
  const [rows, setRows] = useState<QuizOverviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Record<number, AnsweredQuestion[] | "loading" | "error">>({});

  const toggleReview = async (quiz: QuizOverviewRow) => {
    if (Number(quiz.attempt_count) === 0 || !userId) return;

    if (expandedQuizId === quiz.quiz_id) {
      setExpandedQuizId(null);
      return;
    }
    setExpandedQuizId(quiz.quiz_id);
    if (reviews[quiz.quiz_id]) return;

    setReviews((prev) => ({ ...prev, [quiz.quiz_id]: "loading" }));
    try {
      const res = await fetch(`/api/attempt/attemptReview?quizId=${quiz.quiz_id}&userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load review");
      const items: AnsweredQuestion[] = (data.review.items ?? []).map(
        (item: { question: string; user_answer: string | null; level: ScoreCategory | null }) => ({
          question: item.question,
          userAnswer: item.user_answer ?? "",
          category: item.level ?? "false",
          mode: quiz.quiz_type,
          quizItemId: 0,
        })
      );
      setReviews((prev) => ({ ...prev, [quiz.quiz_id]: items }));
    } catch {
      setReviews((prev) => ({ ...prev, [quiz.quiz_id]: "error" }));
    }
  };

  useEffect(() => {
    if (isAuthed === false) router.replace("/login");
  }, [isAuthed, router]);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quiz/quizOverview?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load quizzes");
        setRows(data.quizzes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load quizzes");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [userId]);

  const byMode = useMemo(() => {
    const modes: QuizMode[] = ["flashcards", "mcq", "freetext"];
    return Object.fromEntries(
      modes.map((mode) => [mode, weightedAverage(rows.filter((r) => r.quiz_type === mode))])
    ) as Record<QuizMode, number | null>;
  }, [rows]);

  const byCourse = useMemo(() => {
    const courseTitles = Array.from(new Set(rows.map((r) => r.course_title)));
    return courseTitles.map((title) => ({
      title,
      average: weightedAverage(rows.filter((r) => r.course_title === title)),
    }));
  }, [rows]);

  const groupedByCourse = useMemo(() => {
    const map = new Map<string, QuizOverviewRow[]>();
    for (const row of rows) {
      const list = map.get(row.course_title) ?? [];
      list.push(row);
      map.set(row.course_title, list);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <>
      <h1 className="mb-2 text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
        Quizzes
      </h1>
      <p className="mb-6 text-[13px] text-muted">
        Every quiz generated from your uploads, how often you've taken it, and how you've scored.
      </p>

      {isLoading ? (
        <div className="mb-8 flex min-h-[132px] items-center justify-center rounded-xl border border-panel-border bg-panel text-[12.5px] text-muted">
          Loading quizzes…
        </div>
      ) : error ? (
        <div className="mb-8 rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-6 text-center text-[13px] text-rose">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-10 text-center text-[13px] text-muted">
          No quizzes yet — generate one from a document on the Courses page to see it here.
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted">
            Average score by course
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {byCourse.map((c) => (
              <ScoreStat key={c.title} icon={BarChart3} label={c.title} score={c.average} />
            ))}
          </div>

          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted">
            Average score by mode
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["flashcards", "mcq", "freetext"] as QuizMode[]).map((mode) => (
              <ScoreStat key={mode} icon={MODE_ICONS[mode]} label={MODE_LABELS[mode]} score={byMode[mode]} />
            ))}
          </div>

          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted">All quizzes</h2>
          <div className="flex flex-col gap-6">
            {groupedByCourse.map(([courseTitle, quizzes]) => (
              <div key={courseTitle}>
                <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-secondary)]">
                  <BookOpen size={14} className="text-muted" />
                  {courseTitle}
                </p>
                <div className="overflow-hidden rounded-xl border border-panel-border">
                  {quizzes.map((quiz, i) => {
                    const Icon = MODE_ICONS[quiz.quiz_type];
                    const attempts = Number(quiz.attempt_count);
                    const canReview = attempts > 0;
                    const isExpanded = expandedQuizId === quiz.quiz_id;
                    const review = reviews[quiz.quiz_id];
                    return (
                      <div key={quiz.quiz_id} className={i > 0 ? "border-t border-panel-border" : ""}>
                        <button
                          onClick={() => toggleReview(quiz)}
                          disabled={!canReview}
                          className="flex w-full items-center gap-3 bg-panel px-4 py-3 text-left disabled:cursor-default"
                        >
                          <Icon size={15} className="shrink-0 text-muted" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-[var(--text-secondary)]">{quiz.topic_title}</p>
                            <p className="text-[11px] text-muted">{MODE_LABELS[quiz.quiz_type]}</p>
                          </div>
                          <div className="shrink-0 text-right text-[11.5px] text-muted">
                            <p>
                              {attempts} attempt{attempts === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="w-16 shrink-0 text-right">
                            <p className="text-[15px] font-medium text-[var(--accent-strong)] font-serif">
                              {quiz.average_score !== null ? `${Math.round(Number(quiz.average_score))}%` : "—"}
                            </p>
                          </div>
                          {canReview && (
                            <ChevronDown
                              size={14}
                              className={`shrink-0 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-panel-border bg-[var(--sunken)] px-4 py-3">
                            {review === "loading" ? (
                              <p className="text-[12px] text-muted">Loading review…</p>
                            ) : review === "error" || review === undefined ? (
                              <p className="text-[12px] text-rose">Could not load this attempt's answers.</p>
                            ) : (
                              <>
                                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">
                                  Most recent attempt — every answer given
                                </p>
                                <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                                  {review.map((item, idx) => (
                                    <ReviewRow key={idx} item={item} />
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
