import { z } from "zod";

export const calenderItem = z.object({
userId: z.number(),
date: z.string(),
startTime: z.string(), //HH:MM:SS
endTime: z.string(),  //HH:MM:SS
autoCreated: z.boolean(), //created by AI or User
title: z.string(),
})

export const calenderJustInfo = z.object({
date: z.string(),
title: z.string(),
startTime: z.string(),
endTime: z.string(),
})

export const calender = z.array(calenderItem);

export type CalenderItem = z.infer<typeof calenderItem>
export type Calender = z.infer<typeof calender>
export type CalenderJustInfo = z.infer<typeof calenderJustInfo>
