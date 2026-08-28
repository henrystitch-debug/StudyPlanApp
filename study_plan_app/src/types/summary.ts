import { z } from "zod";

export const aiReplySummary = z.object({
    title: String, 
    summary: String, 
    difficulty: String,
})

export type AiReplySummary = z.infer<typeof aiReplySummary>