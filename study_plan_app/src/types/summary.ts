import { z } from "zod";
export const aiReplySummary = z.object({
  title: z.string(),
  summary: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export type AiReplySummary = z.infer<typeof aiReplySummary>