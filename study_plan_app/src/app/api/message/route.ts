import { getTodaysMessage } from "@/lib/db/message";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));

    if (!uid || Number.isNaN(uid)) {
        return Response.json({ error: "uid is required" }, { status: 400 });
    }

    const today = "";
    const dbResponse = await getTodaysMessage(uid, today);

    if (!dbResponse) {
        return Response.json({ error: "No message found" }, { status: 404 });
    }

    return Response.json(
        { message: dbResponse }
    );
}
