import { getTodaysEventsByUserId } from "@/lib/db/calendar";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const date = searchParams.get("date");

    if (!userId || Number.isNaN(userId) || !date) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const dbResponse = await getTodaysEventsByUserId(userId, date);

    if (!dbResponse) {
        return Response.json({ error: "No events found" }, { status: 404 });
    }

    return Response.json(
        { events: dbResponse }
    );
}
