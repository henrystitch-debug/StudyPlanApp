import { getLatestAttemptReview } from "@/lib/db/attempt";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = Number(searchParams.get("quizId"));
    const userId = Number(searchParams.get("userId"));

    if (!quizId || !userId) {
      return Response.json({ error: "quizId and userId are required" }, { status: 400 });
    }

    const review = await getLatestAttemptReview(quizId, userId);
    if (!review) {
      return Response.json({ error: "No attempt found for this quiz" }, { status: 404 });
    }

    return Response.json({ review });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error while fetching attempt review" }, { status: 500 });
  }
}
