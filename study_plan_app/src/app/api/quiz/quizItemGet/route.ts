import { getQuizItemById } from "@/src/lib/db/quizItem";


export async function GET (uploadid: number, quizType: string, quizItemId: number){

    const dbResponse = getQuizItemById(uploadid, quizType, quizItemId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {quizItem: dbResponse}
    )
}