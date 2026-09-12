import { updateEvent } from "@/lib/db/calendar";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string, eventDate: Date, startTime: string, endTime: string, description: string, type: string }> }
) {
  const { eventId: eventIdParam, eventDate: eventDateParam, startTime: startTimeParam, endTime: endTimeParam, description: descriptionParam, type: typeParam } = await params;
  const eventId = Number(eventIdParam);
  const eventDate = eventDateParam;
  const startTime = startTimeParam;
  const endTime = endTimeParam;
  const description = descriptionParam;
  const type = typeParam;

  if (!eventId || Number.isNaN(eventId) || !eventDate || !startTime || !endTime || !description || !type) {
    return Response.json({ error: "event information is required" }, { status: 400 });
  }

  const updatedEvent = await updateEvent(eventId, eventDate, startTime, endTime, description, type);

  if (!updatedEvent) {
    return Response.json({ error: "Event not found or no fields provided" }, { status: 404 });
  }

  return Response.json({ event: updatedEvent });
}