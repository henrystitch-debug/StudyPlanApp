import { z } from "zod";

export const studyItem = z.object({
studyplanId: z.number(),
taskName: z.string(),
description: z. string(),
location: z.string(),
isCompleted: z.boolean(),
scheduledDate: z.date(),
estimatedTime: z.string(),
})

export const studyplan = z.array(studyItem);

const aiStudyItem = z.object({
  taskName: z.string(),
  description: z.string(),
  location: z.string(),
  estimatedTime: z.string(),
  scheduledDate: z.string(),
});

export const aiStudyplanResponse = z.object({
  items: z.array(aiStudyItem),
});

export const studyplanResponseSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          taskName: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          estimatedTime: { type: "string" },
          scheduledDate: { type: "string", description: "ISO-Datum, z.B. 2026-09-14" },
        },
        required: ["taskName", "description", "location", "estimatedTime", "scheduledDate"],
      },
    },
  },
  required: ["items"],
};

export type StudyplanResult =
  | { success: true; studyplan: Studyplan }
  | { success: false; error: string };

export type StudyItem = z.infer<typeof studyItem>
export type Studyplan = z.infer<typeof studyplan>
