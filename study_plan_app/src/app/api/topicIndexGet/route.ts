import { getTopicIndex } from "@/src/lib/db/topicItem";


export async function GET (uploadId: number){

    const dbResponse = getTopicIndex(uploadId);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {topicIndex: dbResponse}
    )
}