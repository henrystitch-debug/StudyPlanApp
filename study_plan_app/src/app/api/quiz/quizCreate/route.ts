
import { createQuiz } from "@/lib/ai/quiz";
import { getQuizForUpload, saveQuizItems } from "@/lib/db/quizItem";
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

          if(!responseDb){
            return Response.json(
            { error: "Failed saving quizzes" },
            { status: 500})
          }

          // Re-read from the DB rather than echoing the AI response directly,
          // so the caller gets the same quizItemId/quizIds-bearing shape as
          // GET quizGetForUpload (needed to record attempts against the
          // right quiz once the session finishes).
          const saved = await getQuizForUpload(uploadId);
          if (!saved) {
            return Response.json(
            { error: "Failed saving quizzes" },
            { status: 500})
          }

          return Response.json(saved);
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while creating quizzes" },
            { status: 500})
        }
}
