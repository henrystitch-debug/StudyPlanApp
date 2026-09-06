// create studyplan from AI

export async function createStudyplan(uploads : File){

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
                                "content": "Create a studyplan for this content: " + uploads
                            } //TODO: was für ein Prompt? Was returnt es? 
                        ]
                                }),
                            });
    
        const data = await response.json();
        const replyAI =  data.choices?.[0]?.message?.content ?? JSON.stringify(data); 


        return {
            studyplan: replyAI.studyplan
        };
}