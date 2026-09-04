import { createStudyplan } from "@/src/lib/ai/studyplan";
import { saveStudyplan } from "@/src/lib/db/studyplan";

export async function POST (request: Request){
    try{
        //it will be multiple files
        const formData = await request.formData(); 
        const file = formData.get("file") as File | null;

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }

        const responseAI = await createStudyplan(file);

        if(!responseAI){
            return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
          }

          const responseDb = await saveStudyplan("studyplan");

          return Response.json({
            studyplan: responseAI.studyplan,
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
        }
}