import { getAllSummaryTitles } from "@/src/lib/db/summary";


export async function GET (){

    const dbResponse = getAllSummaryTitles();

    if(!dbResponse){
        return;
    }

    return Response.json(
        {titles: dbResponse}
    )
}