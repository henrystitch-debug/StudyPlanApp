import { createStudyplan } from "@/lib/ai/studyplan";
import { saveStudyplan } from "@/lib/db/studyplan";

export async function POST (request: Request){
    try{

        const body = await request.json();
        
        const responseAI = await createStudyplan(body.startDate, body.endDate, body.events, body.topicIndeces, body.capacity);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error while creating studyplan" },
            { status: 500})
          }

          const responseDb = await saveStudyplan(body.userId, body.courseId, responseAI.studyplan);

          if(!responseDb){
            return Response.json(
            { error: "Error while saving studyplan" },
            { status: 500})
          }

          return Response.json({
            studyplan: responseAI.studyplan,
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while creating studyplan" },
            { status: 500})
        }
}