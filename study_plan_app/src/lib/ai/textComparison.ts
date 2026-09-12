import { ai } from "./client";
import { withRetry } from "@/utils/retryApiCall";

const SIMILARITY_THRESHOLD = 70;

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function compareOpenTextAnswers(
  modelAnswer: string,
  userAnswer: string
): Promise<{ score: number; isCorrect: boolean }> {
  const response = await withRetry(() =>
    ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [modelAnswer, userAnswer],
    })
  );

  if (!response?.embeddings || response.embeddings.length < 2) {
    throw new Error("Embedding response was empty or incomplete");
  }

  const [modelEmbedding, userEmbedding] = response.embeddings.map((e) => e.values);

  if (!modelEmbedding || !userEmbedding) {
    throw new Error("One or both embeddings were missing values");
  }

  const similarity = cosineSimilarity(modelEmbedding, userEmbedding);
  const score = Math.round(similarity * 100);

  return {
    score,
    isCorrect: score >= SIMILARITY_THRESHOLD,
  };
}