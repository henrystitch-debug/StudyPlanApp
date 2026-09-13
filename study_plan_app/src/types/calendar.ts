import { z } from "zod";

export const calendarItem = z.object({
userId: z.number(),
date: z.string(),
startTime: z.string(), //HH:MM:SS
endTime: z.string(),  //HH:MM:SS
autoCreated: z.boolean(), //created by AI or User
title: z.string(),
})

export const calendarJustInfo = z.object({
date: z.string(),
title: z.string(),
startTime: z.string(),
endTime: z.string(),
})

export const calendar = z.array(calendarItem);

export type EventType = "lecture" | "exam" | "study_session" | "other";

export type CalendarEvent = {
  id: number;
  date: Date;
  title: string;
  startTime: string;
  endTime: string;
  type: EventType;
  courseId: number | null;
};

export type RawEvent = {
  event_id: number;
  event_date: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  description: string;
  course_id: number | null;
};

export type CalendarItem = z.infer<typeof calendarItem>
export type Calendar = z.infer<typeof calendar>
export type CalendarJustInfo = z.infer<typeof calendarJustInfo>
