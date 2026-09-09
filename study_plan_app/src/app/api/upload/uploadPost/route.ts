import { saveUpload } from "@/src/lib/db/upload";

export async function POST (request: Request){
    try{
        const formData = await request.formData(); 
        const file = formData.get("file") as File | null;
        const courseId = formData.get("courseId");

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }
        if(!courseId){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }

        const responseDb = await saveUpload(+courseId, file);

        if(!responseDb){
            return Response.json(
            { error: "Error while saving upload" },
            { status: 500})
          }

          return Response.json({
            response: responseDb
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while saving upload" },
            { status: 500})
        }
}