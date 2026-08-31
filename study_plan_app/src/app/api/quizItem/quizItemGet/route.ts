import { getQuizItemById } from "@/src/lib/db/quizItem";


export async function GET (uploadid: number, quizItemId: number){

    const dbResponse = getQuizItemById(uploadid, quizItemId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {quizItem: dbResponse}
    )
}