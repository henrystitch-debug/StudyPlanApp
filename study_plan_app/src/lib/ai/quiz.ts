import { promptQuiz } from "@/utils/prompts";
import { aiReplyQuiz, quizSchema, QuizResult } from "@/types/quizItem";
import { withRetry } from "@/utils/retryApiCall";
import { GEMINI_MODEL } from "./config";
import { ai } from "./client";

// The model occasionally returns a structurally-valid response where some
// string fields (MCQ options, in practice) come back null instead of real
// text — schema validation alone doesn't guard against this since
// responseSchema only shapes the JSON, it doesn't enforce it. One retry
// with a fresh generation is far cheaper than shipping unusable quiz data.
const MAX_GENERATION_ATTEMPTS = 2;

export async function createQuiz(file: File): Promise<QuizResult>{
  const isTextFile =
    file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

  let contents;

  if (isTextFile) {
    const text = await file.text();
    contents = [{ text: promptQuiz + "\n\n" + text }];
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    contents = [
      { text: promptQuiz },
      { inlineData: { mimeType: file.type, data: base64Data } },
    ];
  }

  let lastError = "No quiz received.";

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const response = await withRetry(() =>
     ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema
      }
    }));

    if(response.text == undefined || !response.text){
      lastError = "No quiz received.";
      continue;
    }

    const parsed = aiReplyQuiz.safeParse(JSON.parse(response.text));
    if (parsed.success) {
      return { success: true, quiz: parsed.data };
    }

    lastError = "The generated quiz was malformed — please try again.";
  }

  return { success: false, error: lastError };
}
