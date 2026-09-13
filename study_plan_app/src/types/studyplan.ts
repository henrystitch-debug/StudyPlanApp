import { z } from "zod";

export const studyItem = z.object({
studyplanId: z.number(),
taskName: z.string(),
description: z. string(),
location: z.string(),
uploadId: z.string(),
isCompleted: z.boolean(),
scheduledDate: z.string(),
startTime: z.string(),
  endTime: z.string()
})

export const studyplan = z.array(studyItem);

const aiStudyItem = z.object({
  taskName: z.string(),
  description: z.string(),
  location: z.string(),
  uploadId: z.number(),
  scheduledDate: z.string(),
  startTime: z.string(),
  endTime: z.string()
});

export const aiStudyplanResponse = z.array(aiStudyItem);

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
          uploadId: { type: "number"},
          scheduledDate: { type: "string", description: "ISO-Datum, z.B. 2026-09-14" },
          startTime: { type: "string" },
          endTime: { type: "string" }
        },
        required: ["taskName", "description", "location", "scheduledDate", "startTime",  "endTime"],
      },
    },
  },
  required: ["items"],
};

export type StudyplanResult =
  | { success: true; studyplan: AiStudyplanResponse }
  | { success: false; error: string };

export type StudyItem = z.infer<typeof studyItem>
export type Studyplan = z.infer<typeof studyplan>
export type AiStudyplanResponse = z.infer<typeof aiStudyplanResponse>
