import { updateToDoItem } from "@/lib/db/todo";

export async function PUT(
  request: Request) {

  const { todoId, userId, text, completed } = await request.json();

    if (!todoId || Number.isNaN(todoId)) {
    return Response.json({ error: "todoId is required" }, { status: 400 });
  }
  if (!userId || typeof text !== "string" || typeof completed !== "boolean") {
    return Response.json(
      { error: "userId, text, and completed are required" },
      { status: 400 }
    );
  }

  const updated = await updateToDoItem(userId, todoId, text, completed);

  if (!updated) {
    return Response.json({ error: "Todo not found" }, { status: 404 });
  }

  return Response.json({ todo: updated });
}