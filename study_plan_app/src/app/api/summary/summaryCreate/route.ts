import { createSummary } from "../../../../lib/ai/summary";
import { saveSummary } from "@/src/lib/db/summary";

export async function POST (request: Request){
    try{
        const formData = await request.formData(); 
        const file = formData.get("file") as File | null;

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }

        const responseAI = await createSummary(file);

        if(!responseAI){
            return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
          }

        const responseDb = await saveSummary(responseAI.summary);

          return Response.json({
            title: responseAI.title,
            summary: responseAI.summary,
            difficulty: responseAI.difficulty
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
        }
}