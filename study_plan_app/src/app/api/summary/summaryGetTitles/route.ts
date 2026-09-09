import { getAllSummaryTitles } from "@/lib/db/summary";


export async function GET (){

    const dbResponse = await getAllSummaryTitles();

    if(!dbResponse){
        return Response.json({ error: "No titles found" }, { status: 404 });
    }

    return Response.json(
        {titles: dbResponse}
    )
}