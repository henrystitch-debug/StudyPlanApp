// create flashcards from AI

import { aiReplyQuizItem } from "@/src/types/quizItem";

export async function createFlashcards(summary : string){

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
                                "content": "Create flashcards for this content: " + summary
                            } //TODO: was für ein Prompt? Was returnt es? 
                        ]
                                }),
                            });
    
        const data = await response.json();
        const replyAI =  data.choices?.[0]?.message?.content ?? JSON.stringify(data); 

        if(!aiReplyQuizItem.safeParse(replyAI).success){
            return;         
        }

        return {
            title: replyAI.title,
            quizItems: replyAI.quizItems
        };
}