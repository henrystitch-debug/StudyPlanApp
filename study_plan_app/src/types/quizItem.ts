import { z } from "zod";

const quizItemQA = z.object({question: z.string, answer: z.string});
export const quizItemsQA = z.array(quizItemQA);
export type QuizItemsQA = z.infer<typeof quizItemsQA>

const quizItemMCQ = z.object({question: z.string, answer1: z.string, answer2: z.string, answer3: z.string, answer4 : z.string});
export const quizItemsMCQ = z.array(quizItemMCQ);
export type QuizItemsMCQ = z.infer<typeof quizItemsMCQ>

export const aiReplyQuiz = z.object({
    quizFlashcards: quizItemsQA, 
    quizMCQ : quizItemsMCQ,
    quizText : quizItemsQA
})

export type AiReplyQuiz = z.infer<typeof aiReplyQuiz>

export const quizSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
    mcq: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
        },
        required: ["question", "options", "correctIndex"],
      },
    },
    openText: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          modelAnswer: { type: "string" },
        },
        required: ["question", "modelAnswer"],
      },
    },
  },
  required: ["flashcards", "mcq", "openText"],
};