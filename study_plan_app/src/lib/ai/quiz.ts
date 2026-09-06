// create flashcards from AI

import { aiReplyQuizItem } from "@/src/types/quizItem";
import { promptFlashcards } from "@/src/utils/prompts";

export async function createQuiz(file : File){

    //TODO: Alle drei Abfragearten hier holen
    //TODO: add focus instruction for user
    // A reasonable default range is 10–25 cards for a typical lecture-notes-length document, scaling toward 30-40 for a full textbook chapter. Again, let the model use judgment within a bounded range rather than a fixed count — a dense document and a sparse one shouldn't produce the same number of cards.

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
                                "content": promptFlashcards
                            } 
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
            type: replyAI.type,
            quizItems: replyAI.quizItems
        };
}