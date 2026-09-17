import { createItemAttempts, createQuizAttempt } from "@/lib/db/attempt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const quizId = Number(body.quizId);
    const score = Number(body.score);
    const items: { quizItemId: number; score: number; level?: string; userAnswer?: string }[] = Array.isArray(
      body.items
    )
      ? body.items
      : [];

    if (!userId || !quizId || Number.isNaN(score)) {
      return Response.json({ error: "userId, quizId and score are required" }, { status: 400 });
    }

    const attempt = await createQuizAttempt(quizId, userId, score);

    if (items.length > 0) {
      await createItemAttempts(attempt.quiz_attempt_id, items);
    }

    return Response.json({ attempt });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error while saving quiz attempt" }, { status: 500 });
  }
}
