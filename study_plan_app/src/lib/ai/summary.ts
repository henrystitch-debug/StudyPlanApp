import { aiReplySummary } from "@/src/types/summary";

export async function createSummary(text : string){

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
                                "content": "Summarize this content so that it is only a fifth of the original content. Also, give it a title: " + text
                            } //TODO: was für ein Prompt? Was returnt es? 
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