import { bumpStreakIfEligible } from "@/lib/db/user";

// Bumps the caller's streak if today's quiz attempt is their first of the
// day (see bumpStreakIfEligible) — the server decides the new value from
// quiz_attempt history, the caller only identifies who they are.
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));

  if (!userId || Number.isNaN(userId)) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const result = await bumpStreakIfEligible(userId);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "User not found" }, { status: 404 });
  }
}
