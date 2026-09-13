import { compareOpenTextAnswers } from "@/lib/ai/textComparison";

export async function POST (request: Request){
    try{
        const body = await request.json();
        const userAnswer = body.userAnswer;
        const modelAnswer = body.modelAnswer;

        if (!userAnswer || !modelAnswer) {
            return Response.json({ error: "user - and modelanswer are required" }, { status: 400 });
        }

        const score = await compareOpenTextAnswers(modelAnswer, userAnswer);

         if (!score) {
        return Response.json({ error: "Comparison failed" }, { status: 404 });
  }
}
    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while comparing user and model answer" },
            { status: 500})
        }
}