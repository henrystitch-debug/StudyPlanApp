
import { createQuiz } from "@/src/lib/ai/quiz";
import { saveQuizItems } from "@/src/lib/db/quizItem";
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

        const responseAI = await createQuiz(file);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error while creating quiz" },
            { status: 500})
          }

          const responseDb = await saveQuizItems(responseAI.quiz.flashcards, responseAI.quiz.mcq, responseAI.quiz.openText);

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
