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

        if(!responseAI || responseAI.title == "" ||responseAI.summary == ""){
            return Response.json(
            { error: "Error creating summary" },
            { status: 500})
          }

        const responseDb = await saveSummary(responseAI.title, responseAI.summary);
        if(!responseDb){
            return Response.json(
            { error: "Failed saving summary" },
            { status: 500})
        }

          return Response.json({
            title: responseAI.title,
            summary: responseAI.summary,
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while creating summary" },
            { status: 500})
        }
}