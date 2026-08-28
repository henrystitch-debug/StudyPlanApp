import { z } from "zod";


const flashcard = z.object({question: z.string, answer: z.string});
const flashcards = z.array(flashcard);

export const aiReplyFlashcard = z.object({
    flashcards: flashcards
})

export type AiReplyFlashcard = z.infer<typeof aiReplyFlashcard>