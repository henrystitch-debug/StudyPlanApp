import { createStudyplan } from "@/lib/ai/studyplan";
import { saveStudyplan } from "@/lib/db/studyplan";

export async function POST (request: Request){
    try{

        const body = await request.json();
        const { userId, courseId, startDate, endDate, events, capacity, topicIndices } = body;

        if (!userId || !courseId || !startDate || !endDate || !events || !topicIndices || !capacity) {
            return Response.json({ error: "Needed: user id, course id, start date, end date, events, topic indices" }, { status: 400 });
        }
        
        const responseAI = await createStudyplan(startDate, endDate, events, topicIndices, capacity);

        if(!responseAI || !responseAI.success){
            return Response.json(
            { error: "Error while creating studyplan" },
            { status: 500})
          }

          const responseDb = await saveStudyplan(userId, courseId, responseAI.studyplan);

          if(!responseDb || !responseDb.success){
            return Response.json(
            { error: "Error while saving studyplan" },
            { status: 500})
          }

          // saveStudyplan legt die Items in derselben Reihenfolge an, in der sie
          // reingegeben wurden - die echte study_plan_item_id wird hier per Index
          // zurückgemischt, damit "Mark as done" auch direkt nach dem Erzeugen
          // funktioniert (nicht erst nach einem Neuladen der Seite).
          const studyplanWithIds = responseAI.studyplan.map((item, i) => ({
            ...item,
            id: responseDb.items?.[i]?.study_plan_item_id,
          }));

          return Response.json({
            studyplan: studyplanWithIds,
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while creating studyplan" },
            { status: 500})
        }
}