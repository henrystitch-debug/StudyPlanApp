import { getSpecificMessage } from "@/src/lib/db/message";

export async function GET (title: string){

    const dbResponse = getSpecificMessage(title);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {message: dbResponse}
    )
}