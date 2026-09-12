import { saveTopicIndex } from "@/lib/db/topicItem";
import { createSummaryAndTopicIndex } from "../../../../lib/ai/summary";
import { saveSummary } from "@/lib/db/summary";
import { getUploadById } from "@/lib/db/upload";

export async function POST (request: Request){
    try{
        const body = await request.json();
        const uploadId = Number(body.uploadId);

        if (!uploadId || Number.isNaN(uploadId)) {
            return Response.json({ error: "uploadId is required" }, { status: 400 });
        }

        const upload = await getUploadById(uploadId);

         if (!upload) {
        return Response.json({ error: "Upload not found" }, { status: 404 });
  }
        console.log('Buffer length:', upload.data.length, 'filename:', upload.file_name, 'mime:', upload.mime_type);
        const file = new File([upload.data], upload.filename, { type: upload.mimeType });

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