import { getToDosById } from "@/lib/db/todo";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = Number(searchParams.get("userId"));

        if (!userId || Number.isNaN(userId)) {
            return Response.json({ error: "userId is required" }, { status: 400 });
        }

        const dbResponse = await getToDosById(userId);

        if (!dbResponse) {
            return Response.json({ error: "No to-do found" }, { status: 404 });
        }

        return Response.json(
            { todos: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching to-do" },
            { status: 500 }
        );
    }
}
