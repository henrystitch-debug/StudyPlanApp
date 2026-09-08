import { getUploadById } from "@/src/lib/db/upload";

export async function GET (courseId: number){

    const dbResponse = getUploadById(courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {upload: dbResponse}
    )
}