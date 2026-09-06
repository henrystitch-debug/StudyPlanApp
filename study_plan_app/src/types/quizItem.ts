import { z } from "zod";


const quizItem = z.object({question: z.string, answer: z.string});
const quizItems = z.array(quizItem);

export const aiReplyQuizItem = z.object({
    quizItems: quizItems
})

export type AiReplyQuizItem = z.infer<typeof aiReplyQuizItem>