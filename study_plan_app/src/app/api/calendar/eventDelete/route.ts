import { deleteEvent } from "@/lib/db/calendar";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId: eventIdParam } = await params;
  const eventId = Number(eventIdParam);

  if (!eventId || Number.isNaN(eventId)) {
    return Response.json({ error: "eventId is required" }, { status: 400 });
  }

  const deleted = await deleteEvent(eventId);

  if (!deleted) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}