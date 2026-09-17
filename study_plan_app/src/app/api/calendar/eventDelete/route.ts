import { deleteEvent } from "@/lib/db/calendar";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = Number(searchParams.get("eventId"));

        if (!eventId || Number.isNaN(eventId)) {
            return Response.json({ error: "eventId is required" }, { status: 400 });
        }

        const deleted = await deleteEvent(eventId);

        if (!deleted) {
            return Response.json({ error: "Event not found" }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error(err);
        return Response.json({ error: "Error while deleting event" }, { status: 500 });
    }
}
