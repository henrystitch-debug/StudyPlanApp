import { createEvent } from "@/lib/db/calendar";

const ALLOWED_TYPES = ["lecture", "exam", "study_session", "other"];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function POST(request: Request) {
    try {
        const { userId, eventDate, startTime, endTime, eventType, description, courseId } =
            await request.json();

        const uid = Number(userId);

        if (
            !uid ||
            Number.isNaN(uid) ||
            !eventDate ||
            !startTime ||
            !endTime ||
            !ALLOWED_TYPES.includes(eventType)
        ) {
            return Response.json(
                { error: "userId, eventDate, startTime, endTime and a valid eventType are required" },
                { status: 400 }
            );
        }

        if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
            return Response.json({ error: "startTime and endTime must be in HH:MM format" }, { status: 400 });
        }
        if (endTime <= startTime) {
            return Response.json({ error: "endTime must be after startTime" }, { status: 400 });
        }

        const created = await createEvent(
            uid,
            eventDate,
            startTime,
            endTime,
            eventType,
            typeof description === "string" && description.trim() ? description.trim() : null,
            courseId ? Number(courseId) : null
        );

        return Response.json({ event: created }, { status: 201 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: "Error while creating event" }, { status: 500 });
    }
}
