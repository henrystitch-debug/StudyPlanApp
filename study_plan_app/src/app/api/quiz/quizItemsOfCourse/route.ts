import { getQuizItemsOfCourse } from "@/src/lib/db/quizItem";

export async function GET (courseId: number, type: string){

    const dbResponse = getQuizItemsOfCourse(courseId, type);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {flashcards: dbResponse}
    )
}