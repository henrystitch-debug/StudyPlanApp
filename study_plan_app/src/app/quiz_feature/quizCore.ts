import { Ear, ListChecks, PenLine, SquareStack, Layers, type LucideIcon } from "lucide-react";

export type StudyMode = "flashcards" | "mcq" | "freetext" | "auditive" | "combination";
export type ModeDef = { id: StudyMode; label: string; description: string; icon: LucideIcon };
export type Step = "select-mode" | "select-count" | "session";

export const MODES: ModeDef[] = [
  { id: "flashcards", label: "Flashcards", description: "Flip through Q&A cards", icon: SquareStack },
  { id: "mcq", label: "Multiple Choice", description: "Pick the right answer", icon: ListChecks },
  { id: "freetext", label: "Free Text", description: "Write your own answer", icon: PenLine },
  { id: "auditive", label: "Auditive", description: "Listen and speak", icon: Ear },
  { id: "combination", label: "Combination", description: "All modes combined", icon: Layers },
];

// Modes combination mode is allowed to draw from, picked at random with
// replacement per question — repeats back to back are expected.
export const COMBINABLE_MODES: Exclude<StudyMode, "auditive" | "combination">[] = [
  "flashcards",
  "mcq",
  "freetext",
];

export const labelFor = (id: StudyMode) => MODES.find((m) => m.id === id)?.label;

export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 15;

export type Flashcard = { question: string; answer: string };
export type McqQuestion = { question: string; options: string[]; correctIndices: number[] };

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
