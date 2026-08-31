import { getSettingsByUserId } from "@/src/lib/db/settings";

export async function GET (uid: number){

    const dbResponse = getSettingsByUserId(uid);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {quizItem: dbResponse}
    )
}