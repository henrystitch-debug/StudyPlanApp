import { updateToDoItem } from "@/lib/db/todo";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const userId = Number(body.userId);
        const todoId = Number(body.todoId);
        const text = typeof body.text === "string" ? body.text.trim() : "";
        const completed = Boolean(body.completed);

        if (!userId || Number.isNaN(userId) || !todoId || Number.isNaN(todoId) || !text) {
            return Response.json({ error: "userId, todoId and text are required" }, { status: 400 });
        }

        const dbResponse = await updateToDoItem(userId, todoId, text, completed);

        if (!dbResponse) {
            return Response.json({ error: "To-do not found" }, { status: 404 });
        }

        return Response.json(
            { todo: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while updating to-do" },
            { status: 500 }
        );
    }
}
