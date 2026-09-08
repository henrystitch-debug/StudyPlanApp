import { getEventsInRange } from "@/src/lib/db/calendar";

export async function GET (userId: number, startDate: string, endDate: string){

    const dbResponse = getEventsInRange(userId, startDate, endDate);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {calenderEvents: dbResponse}
    )
}