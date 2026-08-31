import { getQuizItemsOfCourse } from "@/src/lib/db/quizItem";

export async function GET (courseId: number){

    const dbResponse = getQuizItemsOfCourse(courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {flashcards: dbResponse}
    )
}