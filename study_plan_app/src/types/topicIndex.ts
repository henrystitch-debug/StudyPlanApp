import { z } from "zod";

export const indexItem = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  effort: z.number()
});

export const topicIndex = z.array(indexItem);
export const fullTopicIndex = z.object({
  uploadId: z.number(),
  items: z.array(indexItem),
});

export const topicIndices = z.array(topicIndex);

export type TopicIndex = z.infer<typeof topicIndex>
export type FullTopicIndex = z.infer<typeof fullTopicIndex>
export type TopicIndices = z.infer<typeof topicIndices>