import { saveTopicIndex } from "@/src/lib/db/topicIndex";
import { TopicIndex } from "@/src/types/topicIndex";


export async function POST (topicIndex: TopicIndex){

    const dbResponse = saveTopicIndex(topicIndex);

    if(!dbResponse){
        return;
    }

    return Response.json(
        {success: true}
    )
}