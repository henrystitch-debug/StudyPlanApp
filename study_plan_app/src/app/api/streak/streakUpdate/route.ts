import { updateUserStreak } from "@/lib/db/user";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string, streak: string}> }
) {
  const { userId: userIdParam, streak: streakParam } = await params;
  const userId = Number(userIdParam);
  const streak = Number(streakParam);

  if (!userId || Number.isNaN(userId) || !streak) {
    return Response.json({ error: "userid and streak is required" }, { status: 400 });
  }

  const updatedUser = await updateUserStreak(userId, streak);

  if (!updatedUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: updatedUser });
}