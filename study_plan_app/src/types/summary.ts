import { z } from "zod";
export const aiReplySummary = z.object({
  title: z.string(),
  summary: z.string(),
});
export type AiReplySummary = z.infer<typeof aiReplySummary>