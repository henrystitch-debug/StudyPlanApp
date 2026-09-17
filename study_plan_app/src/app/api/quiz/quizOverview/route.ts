import { getQuizOverviewForUser } from "@/lib/db/quizItem";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const rows = await getQuizOverviewForUser(userId);
    return Response.json({ quizzes: rows });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error while fetching quiz overview" }, { status: 500 });
  }
}
