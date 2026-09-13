import { getToDosById } from "@/lib/db/todo";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = Number(searchParams.get("uid"));

        if (!uid || Number.isNaN(uid)) {
            return Response.json({ error: "uid is required" }, { status: 400 });
        }

        const dbResponse = await getToDosById(uid);

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
