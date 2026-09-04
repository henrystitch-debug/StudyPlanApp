// create flashcards from AI
import { GoogleGenAI } from "@google/genai";
import { AiReplyQuiz, aiReplyQuiz } from "@/src/types/quizItem";
import { promptQuiz } from "@/src/utils/prompts";
import { quizSchema } from "@/src/types/quizItem";

const ai = new GoogleGenAI({});

export async function createQuiz(file: File): Promise<AiReplyQuiz>{
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

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents,
    config: {
    responseMimeType: "application/json",
    responseSchema: quizSchema
    }
  });

  if(response.text == undefined || !response.text){
     return { quizFlashcards: [{question : "empty", answer : "empty"}], 
      quizMCQ : [{question : "empty", answer1 : "empty", answer2: "empty", answer3: "empty", answer4: "empty"}],
      quizText : [{question : "empty", answer : "empty"}]
  }
  }

  const quizResponse = JSON.parse(response.text)

  console.log("+++++++++++++++++++++++++");
  console.log("quizResponse: " + JSON.stringify(quizResponse));
  console.log("+++++++++++++++++++++++++");
  console.log("quizResponse.flashcards: " + JSON.stringify(quizResponse.flashcards));
  console.log("+++++++++++++++++++++++++");
  console.log("quizResponse.mcq: " + JSON.stringify(quizResponse.mcq));
  console.log("+++++++++++++++++++++++++");
  console.log("quizResponse.openText: " + JSON.stringify(quizResponse.openText));
  console.log("+++++++++++++++++++++++++");

  const flashcards = quizResponse.flashcards.items;
  const mcq = quizResponse.mcq.items;
  const freeText = quizResponse.openText.items;

  const fullQuiz = {
      quizFlashcards: flashcards, 
      quizMCQ : mcq,
      quizText : freeText
  }

  return fullQuiz;
}
