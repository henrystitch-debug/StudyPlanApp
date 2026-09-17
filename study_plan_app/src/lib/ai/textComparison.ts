import { z } from "zod";
import { ai } from "./client";
import { GEMINI_MODEL } from "./config";
import { withRetry } from "@/utils/retryApiCall";

const SIMILARITY_THRESHOLD = 70;
const MAX_GRADING_ATTEMPTS = 2;

const gradingResult = z.object({ score: z.number().min(0).max(100) });

const GRADING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
  },
  required: ["score"],
};

// Embedding cosine-similarity was the original approach here, but raw
// cosine similarity between two pieces of text has a high noise floor —
// even weakly-related text commonly lands at 0.3-0.6 similarity purely
// from embedding-space geometry, not shared meaning. That's what let a
// single on-topic keyword (with zero actual explanation) score 50-60%.
// Asking the model to directly judge understanding — the same
// generateContent + structured-JSON pattern already used for quiz
// generation (see lib/ai/quiz.ts) — grades what was actually asked for.
function buildGradingPrompt(modelAnswer: string, userAnswer: string): string {
  return `You are grading a student's free-text quiz answer against the ideal answer. Judge ONLY how much of the ideal answer's actual meaning and key information the student's answer demonstrates — not word overlap, not spelling, not phrasing style.

Ideal answer: "${modelAnswer}"
Student's answer: "${userAnswer}"

Score from 0 to 100:
- 90-100: conveys essentially all the key information, even if worded very differently.
- 60-89: conveys most of the key information, with some gaps.
- 30-59: shows genuine understanding of part of the topic, but misses most of the key information.
- 1-29: only tangentially related — e.g. a single relevant keyword or name with no real explanation — and demonstrates little to no actual understanding.
- 0: blank, completely unrelated, or nonsensical.

Be strict: a single correct word or name copied from the ideal answer, with no supporting explanation, must score in the 1-29 range — it does not show real understanding.`;
}

export async function compareOpenTextAnswers(
  modelAnswer: string,
  userAnswer: string
): Promise<{ score: number; isCorrect: boolean }> {
  let lastError: unknown = new Error("No grading response received.");

  for (let attempt = 1; attempt <= MAX_GRADING_ATTEMPTS; attempt++) {
    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ text: buildGradingPrompt(modelAnswer, userAnswer) }],
          config: {
            responseMimeType: "application/json",
            responseSchema: GRADING_RESPONSE_SCHEMA,
          },
        })
      );

      if (!response.text) {
        lastError = new Error("Grading response was empty");
        continue;
      }

      const parsed = gradingResult.safeParse(JSON.parse(response.text));
      if (!parsed.success) {
        lastError = new Error("Grading response was malformed");
        continue;
      }

      const score = Math.round(parsed.data.score);
      return { score, isCorrect: score >= SIMILARITY_THRESHOLD };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}
