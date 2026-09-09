// create flashcards from AI
import { GoogleGenAI } from "@google/genai";
import { promptQuiz } from "@/utils/prompts";
import { quizSchema, QuizResult } from "@/types/quizItem";
import { withRetry } from "@/utils/retryApiCall";
import { GEMINI_MODEL } from "./config";

const ai = new GoogleGenAI({});

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
     return { success: false, error: "No quiz received."
   }
  }

  const quizResponse = JSON.parse(response.text)

  const fullQuiz = {
      flashcards: quizResponse.flashcards, 
      mcq : quizResponse.mcq,
      openText : quizResponse.openText
  }

  return {success: true, quiz: fullQuiz};
}
