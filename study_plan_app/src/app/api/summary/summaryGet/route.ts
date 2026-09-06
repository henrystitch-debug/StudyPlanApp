import { getSummaryById } from "@/src/lib/db/summary";


export async function GET (id: number){

    const summaryId = id;
    const dbResponse = getSummaryById(summaryId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {summary: dbResponse}
    )
}