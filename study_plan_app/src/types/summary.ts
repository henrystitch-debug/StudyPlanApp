import { z } from "zod";
import { indexItem } from "./topicIndex";
export const aiReplySummary = z.object({
  title: z.string(),
  summary: z.string(),
});

export const summaryAndTopicIndexResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    topicIndex: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          effort: { type: "number" },
        },
        required: ["title", "description", "location", "effort"],
      },
    },
  },
  required: ["title", "summary", "topicIndex"],
};

const aiSummaryResponse = z.object({
  title: z.string(),
  summary: z.string(),
  topicIndex: z.array(indexItem),
});

export type AiSummaryResponse = z.infer<typeof aiSummaryResponse>

export type SummaryResult =
  | { success: true; content: AiSummaryResponse }
  | { success: false; error: string };