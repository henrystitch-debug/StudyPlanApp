
import { createQuiz } from "@/lib/ai/quiz";
import { saveQuizItems } from "@/lib/db/quizItem";
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

        const file = new File([upload.data], upload.file_name, { type: upload.mime_type });

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }

        const responseAI = await createQuiz(file);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error while creating quiz" },
            { status: 500})
          }

          const responseDb = await saveQuizItems(uploadId, responseAI.quiz.flashcards, responseAI.quiz.mcq, responseAI.quiz.openText);

          return Response.json({
            flashcards: responseAI.quiz.flashcards,
            mcq: responseAI.quiz.mcq,
            openText: responseAI.quiz.openText
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
        }
}
