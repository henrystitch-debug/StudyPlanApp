import { getAllEventsByUserId } from "@/src/lib/db/calendar";

export async function GET (id: number){

    const userId = id;
    const dbResponse = getAllEventsByUserId(userId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {calenderEvents: dbResponse}
    )
}