import { Ear, ListChecks, PenLine, SquareStack, Layers, type LucideIcon } from "lucide-react";

export type StudyMode = "flashcards" | "mcq" | "freetext" | "auditive" | "combination";
export type ModeDef = { id: StudyMode; label: string; description: string; icon: LucideIcon };
export type Step = "select-mode" | "session";

export const MODES: ModeDef[] = [
  { id: "flashcards", label: "Flashcards", description: "Flip through Q&A cards", icon: SquareStack },
  { id: "mcq", label: "Multiple Choice", description: "Pick the right answer", icon: ListChecks },
  { id: "freetext", label: "Free Text", description: "Write your own answer", icon: PenLine },
  { id: "auditive", label: "Auditive", description: "Listen and speak", icon: Ear },
  { id: "combination", label: "Combination", description: "All modes combined", icon: Layers },
];

export const labelFor = (id: StudyMode) => MODES.find((m) => m.id === id)?.label;

export type Flashcard = { quizItemId: number; question: string; answer: string };
export type McqQuestion = { quizItemId: number; question: string; options: string[]; correctIndices: number[] };

// quiz_id per real quiz type for one upload — null for a type that was
// never generated. Needed to record an attempt against the right quiz row.
export type QuizIds = { flashcards: number | null; mcq: number | null; freetext: number | null };

// One answered question, kept for the end-of-session review list — enough
// to show what was asked and what the user did with it — and doubling as
// the unit persisted server-side (mode + quizItemId identify exactly which
// quiz_item this was, regardless of which session type produced it).
export type AnsweredQuestion = {
  question: string;
  userAnswer: string;
  category: ScoreCategory;
  mode: Exclude<StudyMode, "auditive" | "combination">;
  quizItemId: number;
};

// Three tiers now (was four) — matches the end-of-session panel's own
// >=80% / >=50% / below thresholds, so a single question's grade and the
// whole session's grade always mean the same thing.
export type ScoreCategory = "correct" | "partly" | "false";

export const SCORE_STYLES: Record<ScoreCategory, { label: string; passed: boolean; text: string; border: string; bg: string }> = {
  correct: {
    label: "Correct",
    passed: true,
    text: "text-[var(--score-correct)]",
    border: "border-[var(--score-correct)]/40",
    bg: "bg-[var(--score-correct)]/10",
  },
  partly: {
    label: "Partly correct",
    passed: false,
    text: "text-[var(--score-mostly)]",
    border: "border-[var(--score-mostly)]/40",
    bg: "bg-[var(--score-mostly)]/10",
  },
  false: {
    label: "False",
    passed: false,
    text: "text-[var(--score-false)]",
    border: "border-[var(--score-false)]/40",
    bg: "bg-[var(--score-false)]/10",
  },
};

export const RATING_OPTIONS: ScoreCategory[] = ["correct", "partly", "false"];

// >=80% correct, >=50% partly correct, below is false.
export function classifyScore(percent: number): ScoreCategory {
  if (percent >= 80) return "correct";
  if (percent >= 50) return "partly";
  return "false";
}

export function isPassed(r: ScoreCategory | null): boolean {
  return r === "correct";
}

// One real quiz's worth of answers within a finished session — a plain
// flashcards/mcq/freetext session produces exactly one of these, while a
// combination session (which mixes all three) produces one per mode it
// actually touched. This is the unit the caller persists as a single
// quiz_attempt row plus its item_attempts.
export type ModeAttempt = {
  mode: Exclude<StudyMode, "auditive" | "combination">;
  quizId: number | null;
  passed: number;
  total: number;
  answered: AnsweredQuestion[];
};

const SCORE_FOR_CATEGORY: Record<ScoreCategory, number> = { correct: 100, partly: 50, false: 0 };

// Splits a session's flat answered list back out by mode (a no-op split
// for flashcards/mcq/freetext sessions, since every item already shares
// the same mode there) so each group can be recorded as its own attempt.
export function groupAnsweredByMode(answered: AnsweredQuestion[], quizIds: QuizIds): ModeAttempt[] {
  const groups = new Map<AnsweredQuestion["mode"], AnsweredQuestion[]>();
  for (const item of answered) {
    const list = groups.get(item.mode) ?? [];
    list.push(item);
    groups.set(item.mode, list);
  }
  return Array.from(groups.entries()).map(([mode, items]) => ({
    mode,
    quizId: quizIds[mode],
    passed: items.filter((i) => isPassed(i.category)).length,
    total: items.length,
    answered: items,
  }));
}

export function scoreForCategory(category: ScoreCategory): number {
  return SCORE_FOR_CATEGORY[category];
}

// End-of-session encouragement, tiered by how many questions were missed
// (absolute count, not percentage — missing 2 out of 3 reads very
// differently than missing 2 out of 30). One is picked at random per
// session so repeat perfect scores don't always show the same line.
const MOTIVATION_TIERS: { icon: string; lines: string[] }[] = [
  {
    icon: "🏆",
    lines: [
      "Flawless! You nailed every single question.",
      "Perfect score — you clearly know your stuff.",
      "100%. Nothing left to prove here.",
    ],
  },
  {
    icon: "🔥",
    lines: [
      "So close to perfect — great work!",
      "Almost flawless, just a couple slipped through.",
      "Strong performance, right at the top.",
    ],
  },
  {
    icon: "💪",
    lines: [
      "Solid effort — you've got a good grasp on this.",
      "Good work, a bit more practice and you'll be unstoppable.",
      "Not bad at all — the basics are clearly there.",
    ],
  },
  {
    icon: "🌱",
    lines: [
      "Every attempt makes you sharper — keep at it.",
      "Good start — review and try again, you'll improve fast.",
      "Progress isn't always a high score, it's showing up. Nice try!",
    ],
  },
];

export function pickMotivationalMessage(passed: number, total: number): { icon: string; text: string } {
  const missed = total - passed;
  const tier = missed === 0 ? 0 : missed <= 2 ? 1 : missed <= 5 ? 2 : 3;
  const { icon, lines } = MOTIVATION_TIERS[tier];
  return { icon, text: lines[Math.floor(Math.random() * lines.length)] };
}

// Excluded from matching — otherwise any answer sharing so much as "the"
// or "is" with the ideal answer reads as a (meaningless) word hit.
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "with", "as", "by", "from", "into", "onto", "that", "this",
  "these", "those", "it", "its", "if", "so", "than", "then", "also", "not", "no", "can", "could",
  "will", "would", "should", "may", "might", "must", "has", "have", "had", "do", "does", "did",
  "i", "you", "he", "she", "we", "they", "them", "his", "her", "their", "our", "your", "which",
  "what", "when", "where", "who", "whom", "how", "there", "here", "over", "under", "about",
]);

export function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w));
}

// Word-overlap match against the ideal answer, used to score free-text
// answers until real semantic comparison is wired up to /api/compareOpenText.
export function scoreFreeText(userAnswer: string, idealAnswer: string): number {
  const idealWords = normalizeWords(idealAnswer);
  const userWords = new Set(normalizeWords(userAnswer));
  if (idealWords.length === 0) return 0;

  const matched = idealWords.filter((w) => userWords.has(w)).length;
  return Math.min(100, (matched / idealWords.length) * 100);
}

// --- Retake markers -------------------------------------------------
// Lightweight, local-only memory of how a question went last time, so a
// repeated session can flag "you got this wrong before" etc. This is a
// stand-in for real persistence: once quiz attempts are stored server-side
// and retakes are driven from the study plan, this should be replaced by
// that data instead of localStorage.
const MARKER_STORAGE_KEY = "study-quiz-markers:v1";

type MarkerMap = Record<string, ScoreCategory>;

function readMarkerMap(): MarkerMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MARKER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MarkerMap) : {};
  } catch {
    return {};
  }
}

function writeMarkerMap(map: MarkerMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private mode, quota, etc.) — markers are a
    // nice-to-have, fail silently rather than breaking the quiz.
  }
}

function markerKey(mode: StudyMode, questionKey: string) {
  return `${mode}:${questionKey}`;
}

export function getRetakeMarker(mode: StudyMode, questionKey: string): ScoreCategory | null {
  return readMarkerMap()[markerKey(mode, questionKey)] ?? null;
}

export function setRetakeMarker(mode: StudyMode, questionKey: string, category: ScoreCategory) {
  const map = readMarkerMap();
  map[markerKey(mode, questionKey)] = category;
  writeMarkerMap(map);
}
