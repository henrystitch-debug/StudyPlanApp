import { GoogleGenAI } from "@google/genai";
import { type AiReplySummary, type SummaryResult } from "@/src/types/summary";
import { promptSummary } from "@/src/utils/prompts";

const ai = new GoogleGenAI({});

export async function createSummary(file: File): Promise<SummaryResult>{
  const isTextFile =
    file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

  let contents;

  if (isTextFile) {
    const text = await file.text();
    contents = [{ text: promptSummary + "\n\n" + text }];
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    contents = [
      { text: promptSummary },
      { inlineData: { mimeType: file.type, data: base64Data } },
    ];
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents,
    config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        summary: {
          type: "string",
        },
      },
      required: ["title", "summary"],
    },
  },
  });

  if(response.text == undefined || !response.text){
    return {
    success: false, error: "No summary received"
  }
}

  const sumAndTitle = JSON.parse(response.text)
  const ti : string = sumAndTitle.title;
  const sum : string = sumAndTitle.summary;

  return {
    success: true, summary: {title: ti, summary: sum}
  }
}
