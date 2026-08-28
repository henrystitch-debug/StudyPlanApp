import { getFlashcardById } from "@/src/lib/db/flashcard";


export async function GET (id: number){

    const flashcardId = id;
    const dbResponse = getFlashcardById(flashcardId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {flashcard: dbResponse}
    )
}