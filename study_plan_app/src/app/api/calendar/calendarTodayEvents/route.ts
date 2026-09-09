import { getTodaysEventsByUserId } from "@/lib/db/calendar";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const dbResponse = await getTodaysEventsByUserId(userId);

    if (!dbResponse) {
        return Response.json({ error: "No events found" }, { status: 404 });
    }

    return Response.json(
        { calenderEvents: dbResponse }
    );
}
