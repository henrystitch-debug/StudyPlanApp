import { saveTopicIndex } from "@/src/lib/db/topicItem";
import { createSummaryAndTopicIndex } from "../../../../lib/ai/summary";
import { saveSummary } from "@/src/lib/db/summary";
import { getUploadById } from "@/src/lib/db/upload";

export async function POST (uploadId: number){
    try{

        const upload = await getUploadById(uploadId);

         if (!upload) {
        return Response.json({ error: "Upload not found" }, { status: 404 });
  }

        const file = new File([upload.data.data], upload.data.filename, { type: upload.data.mimeType });

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }
        const responseAI = await createSummaryAndTopicIndex(file);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error creating summary" },
            { status: 500})
          }

        const responseDbSummary = await saveSummary(uploadId, responseAI.content.title, responseAI.content.summary);
        if(!responseDbSummary){
            return Response.json(
            { error: "Failed saving summary" },
            { status: 500})
        }
        

        const responseDbTopicIndex = await saveTopicIndex(uploadId, responseAI.content.topicIndex);
        if(!responseDbTopicIndex){
            return Response.json(
            { error: "Failed saving summary" },
            { status: 500})
        }

          return Response.json({
            title: responseAI.content.title,
            summary: responseAI.content.summary,
            topicIndex: responseAI.content.topicIndex 
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while creating summary and topic index" },
            { status: 500})
        }
}