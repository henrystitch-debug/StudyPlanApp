import { getStudyplanById } from "@/src/lib/db/studyPlan";


export async function GET (courseId: number){

    const dbResponse = getStudyplanById(courseId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {studyPlan: dbResponse}
    )
}