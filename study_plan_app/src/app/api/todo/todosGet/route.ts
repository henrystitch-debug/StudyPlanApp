import { getToDosById } from "@/lib/db/todo";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
        return Response.json({ error: "userId" }, { status: 400 });
    }

    const dbResponse = await getToDosById(userId);

    if (!dbResponse) {
        return Response.json({ error: "ToDos not found" }, { status: 404 });
    }

    return Response.json(
        { todos: dbResponse }
    );
}
