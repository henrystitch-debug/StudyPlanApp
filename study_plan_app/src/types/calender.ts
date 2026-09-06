import { z } from "zod";

export const calenderItem = z.object({
userId: z.number(),
date: z.date(),
autoCreated: z.boolean(), //created by AI or User
type: z.string(),
})

export const calender = z.array(calenderItem);

export type CalenderItem = z.infer<typeof calenderItem>
export type Calender = z.infer<typeof calender>
