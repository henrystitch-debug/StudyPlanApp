import { updateUserName } from "@/lib/db/user";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string, name: string}> }
) {
  const { userId: userIdParam, name: nameParam } = await params;
  const userId = Number(userIdParam);
  const name = nameParam;

  if (!userId || Number.isNaN(userId) || !name) {
    return Response.json({ error: "uploadId and file name is required" }, { status: 400 });
  }

  const updatedUser = await updateUserName(userId, name);

  if (!updatedUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: updatedUser });
}