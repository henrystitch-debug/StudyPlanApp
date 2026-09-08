
import { createQuiz } from "@/lib/ai/quiz";
import { saveQuizItems } from "@/lib/db/quizItem";
import { getUploadById } from "@/lib/db/upload";

// GEÄNDERT: statt "uploadId: number" nimmt der Handler jetzt ein Request-Objekt
// entgegen. Next.js ruft POST-Route-Handler immer mit (request: Request) auf,
// nie mit eigenen Parametern - "uploadId" war vorher zur Laufzeit immer undefined.
export async function POST (request: Request){
    try{
        // NEU: uploadId wird aus dem JSON-Body gelesen, z.B. { "uploadId": 1 }
        const body = await request.json();
        const uploadId = Number(body.uploadId);

        if (!uploadId || Number.isNaN(uploadId)) {
            return Response.json({ error: "uploadId is required" }, { status: 400 });
        }

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
