import { z } from "zod";

export const topicIndex = z.object({
  uploadId: z.number(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  effort: z.number()
});

export type TopicIndex = z.infer<typeof topicIndex>