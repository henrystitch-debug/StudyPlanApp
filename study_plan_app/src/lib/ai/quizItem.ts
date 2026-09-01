// create flashcards from AI

import { aiReplyQuizItem } from "@/src/types/quizItem";

export async function createQuiz(file : File){

    //TODO: add focus instruction for user
    // A reasonable default range is 10–25 cards for a typical lecture-notes-length document, scaling toward 30-40 for a full textbook chapter. Again, let the model use judgment within a bounded range rather than a fixed count — a dense document and a sparse one shouldn't produce the same number of cards.

    const prompt = "System: You are a study aid for university students. Generate flashcards from the given document to help a student memorize and test themselves on key facts, definitions, and concepts. Rules: - Each flashcard should test ONE discrete fact, definition, or concept — not multiple ideas bundled together. - Prefer questions over fill-in-the-blank fragments. Write natural questions a student could be asked out loud. - Avoid trivial or overly obvious cards. Avoid duplicating the same concept twice in different wording. Cover the breadth of the document, not just the first section. - Generate between {min} and {max} cards, depending on how much distinct testable content the document actually contains — do not pad to hit a number. {focus_instruction} Tool: create_flashcards(cards: [{front: string, back: string, topic: string}])"

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