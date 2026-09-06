import { getAllEventsByUserId } from "@/src/lib/db/calendar";

export async function GET (userId: number){

    const dbResponse = getAllEventsByUserId(userId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {calenderEvents: dbResponse}
    )
}