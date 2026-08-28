import { getFlashcardsOFCourse } from "@/src/lib/db/flashcard";


export async function GET (id: number){

    const courseId = id;
    const dbResponse = getFlashcardsOFCourse(courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {flashcards: dbResponse}
    )
}