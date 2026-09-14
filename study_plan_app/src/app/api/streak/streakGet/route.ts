import { getStreakStats } from "@/lib/db/user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));

  if (!userId || Number.isNaN(userId)) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const stats = await getStreakStats(userId);

  if (!stats) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ streak: stats });
}