import { createToDo } from "@/lib/db/todo";

export async function POST(request: Request) {
  try {
    const { userId, text } = await request.json();

    if (!userId || !text) {
      return Response.json({ error: "userId and text are required" }, { status: 400 });
    }

    const todo = await createToDo(userId, text);
    return Response.json({ todo });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error creating todo" }, { status: 500 });
  }
}