import { deleteQuiz } from "@/lib/db/quizItem";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId: quizIdParam } = await params;
  const quizId = Number(quizIdParam);

  if (!quizId || Number.isNaN(quizId)) {
    return Response.json({ error: "quizId is required" }, { status: 400 });
  }

  const deleted = await deleteQuiz(quizId);

  if (!deleted) {
    return Response.json({ error: "Quiz not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}