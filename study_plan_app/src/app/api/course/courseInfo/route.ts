import { getCourseInfo } from "@/src/lib/db/course";

export async function GET (uid: number, courseId: number){

    const dbResponse = getCourseInfo(uid, courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {courseInfo: dbResponse}
    )
}