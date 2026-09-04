
import { createQuiz } from "@/src/lib/ai/quiz";
import { saveQuizItems } from "@/src/lib/db/quizItem";

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

        const responseAI = await createQuiz(file);

        if(!responseAI){
            return Response.json(
            { error: "Error while creating quiz" },
            { status: 500})
          }

          const responseDb = await saveQuizItems(responseAI.quizFlashcards, responseAI.quizMCQ, responseAI.quizText);

          return Response.json({
            flashcards: responseAI.quizFlashcards,
            mcq: responseAI.quizMCQ,
            freeText: responseAI.quizText
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
        }
}
