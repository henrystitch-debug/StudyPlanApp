import { getAllCoursesOfUser } from "@/src/lib/db/course";

export async function GET (uid: number){

    const dbResponse = getAllCoursesOfUser(uid);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {courses: dbResponse}
    )
}