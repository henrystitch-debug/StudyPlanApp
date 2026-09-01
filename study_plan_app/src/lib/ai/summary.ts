import { aiReplySummary } from "@/src/types/summary";

// create new summary from AI
export async function createSummary(file : File){

    //TODO: figure out how many pages file is to adjust the wanted length of the summary
    // Where {length_instruction} is something like "roughly 150-250 words for short documents (under 5 pages), scaling up to 500-700 words for longer ones — aim for about 10-15% of the original length, whichever gives a more complete summary."

    const prompt = "System: You are a study aid for university students. You will be given a document (lecture notes, textbook excerpt, or slides). Produce a summary that helps a student review the material efficiently before an exam. Rules: - Cover every major concept in the document; do not omit a topic just to save space. - Use short paragraphs or bullet points grouped by topic/section, matching the document's own structure where there is one. - Prioritize definitions, cause-effect relationships, and anything the document itself emphasizes (bold text, headers, repeated terms). - Do not add outside information or your own opinions — stay grounded in the document. - Target length: {length_instruction} {focus_instruction}";

     const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { //TODO: durch tatsächliche AI ersetzen
                        method: 'POST',
                        headers: {
                        Authorization: 'Bearer ' + process.env.OPEN_ROUTER_AI_KEY,
                        'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "model": "openrouter/auto-beta",
                            "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            } 
                        ]
                                }),
                            });
    
        const data = await response.json();
        const replyAI =  data.choices?.[0]?.message?.content ?? JSON.stringify(data); 

        if(!aiReplySummary.safeParse(replyAI).success){
            return;         
        }

        return {
            title: replyAI.title,
            summary: replyAI.summmary,
            difficulty: replyAI.difficulty
        };
}