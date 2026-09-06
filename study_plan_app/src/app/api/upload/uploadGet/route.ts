import { getUploadsByCourseId } from "@/src/lib/db/upload";

export async function GET (courseId: number){

    const dbResponse = getUploadsByCourseId(courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {uploads: dbResponse}
    )
}