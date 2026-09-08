import { GoogleGenAI } from "@google/genai";
import { summaryAndTopicIndexResponseSchema, type SummaryResult } from "@/types/summary";
import { promptSummary } from "@/utils/prompts";
import { withRetry } from "@/utils/retryApiCall";
import { GEMINI_MODEL } from "./config";

const ai = new GoogleGenAI({});

export async function createSummaryAndTopicIndex(file: File): Promise<SummaryResult>{
  const isTextFile =
    file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

  let contents;

  if (isTextFile) {
    const text = await file.text();
    contents = [{ text: promptSummary + "\n\n" + text }];
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    contents = [ //TODO: Prompt anpassen zu dem mit topic index
      { text: promptSummary },
      { inlineData: { mimeType: file.type, data: base64Data } },
    ];
  }

  const response = await withRetry(() =>
   ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
    responseMimeType: "application/json",
    responseSchema: summaryAndTopicIndexResponseSchema
  },
  }));

  if(response.text == undefined || !response.text){
    return {
    success: false, error: "No summary received"
  }
}
  const sumTitleIndex = JSON.parse(response.text)

  return {
    success: true, content: {title: sumTitleIndex.title, summary: sumTitleIndex.summary, topicIndex: sumTitleIndex.topicIndex}
  }
}