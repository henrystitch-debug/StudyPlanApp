import { deleteUser } from "@/lib/db/user";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);

  if (!userId || Number.isNaN(userId)) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const deleted = await deleteUser(userId);

  if (!deleted) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}