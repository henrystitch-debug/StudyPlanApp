import { getEventsInRange } from "@/lib/db/calendar";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = Number(searchParams.get("userId"));
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!userId || Number.isNaN(userId) || !startDate || !endDate) {
            return Response.json({ error: "userId, startDate and endDate are required" }, { status: 400 });
        }

        const dbResponse = await getEventsInRange(userId, startDate, endDate);

        if (!dbResponse) {
            return Response.json({ error: "No events found" }, { status: 404 });
        }

        return Response.json(
            { calenderEvents: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching events" },
            { status: 500 }
        );
    }
}
