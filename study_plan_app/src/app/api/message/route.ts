import { getTodaysMessage } from "@/src/lib/db/message";

export async function GET (uid: number){

    const today = "";
    const dbResponse = getTodaysMessage(uid, today);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {message: dbResponse}
    )
}