import { deleteToDo } from "@/lib/db/todo";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = Number(searchParams.get("uid"));
        const todoId = Number(searchParams.get("todoId"));

        if (!uid || Number.isNaN(uid) || !todoId || Number.isNaN(todoId)) {
            return Response.json({ error: "uid and todoId are required" }, { status: 400 });
        }

        const dbResponse = await deleteToDo(uid, todoId);

        if (!dbResponse) {
            return Response.json({ error: "To-do not found" }, { status: 404 });
        }

        return Response.json(
            { success: true }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while deleting to-do" },
            { status: 500 }
        );
    }
}
