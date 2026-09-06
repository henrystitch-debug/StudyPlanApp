import { Calender } from "@/src/types/calender";
import { createStudyplan } from "@/src/lib/ai/studyplan";
import { saveStudyplan } from "@/src/lib/db/studyplan";
import { TopicIndex } from "@/src/types/topicIndex";

export async function POST (courseId: number, startDate: Date, endDate: Date, events: Calender, topicIndex: TopicIndex, capacity: number){
    try{
        const responseAI = await createStudyplan(startDate, endDate, events, topicIndex, capacity);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error while creating studyplan" },
            { status: 500})
          }

          const responseDb = await saveStudyplan(courseId, responseAI.studyplan);

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