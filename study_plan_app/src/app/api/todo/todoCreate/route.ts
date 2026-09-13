import { createToDo } from "@/lib/db/todo";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const uid = Number(body.uid);
        const text = typeof body.text === "string" ? body.text.trim() : "";

        if (!uid || Number.isNaN(uid) || !text) {
            return Response.json({ error: "uid and text are required" }, { status: 400 });
        }

        const dbResponse = await createToDo(uid, text);

        if (!dbResponse) {
            return Response.json({ error: "Error while creating to-do" }, { status: 500 });
        }

        return Response.json(
            { todo: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while creating to-do" },
            { status: 500 }
        );
    }
}
