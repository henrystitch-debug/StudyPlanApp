import { getUserById } from "@/src/lib/db/user";

export async function GET (uid: number){

    const dbResponse = getUserById(uid);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {userInfo: dbResponse}
    )
}