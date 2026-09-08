import { getEventsInRange } from "@/lib/db/calendar";

// GEÄNDERT: statt "userId, startDate, endDate" nimmt der Handler jetzt ein
// Request-Objekt entgegen. Next.js ruft GET-Route-Handler immer mit
// (request: Request) auf, nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: userId, startDate und endDate werden aus den Query-Parametern der URL
    // gelesen, z.B. /api/calendar/calenderRangeEvents?userId=1&startDate=2026-01-01&endDate=2026-01-31
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // NEU: Validierung - fehlt einer der Parameter oder ist userId ungültig,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!userId || Number.isNaN(userId) || !startDate || !endDate) {
        return Response.json({ error: "userId, startDate and endDate are required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getEventsInRange eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getEventsInRange(userId, startDate, endDate);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls keine Events gefunden wurden.
    if (!dbResponse) {
        return Response.json({ error: "No events found" }, { status: 404 });
    }

    return Response.json(
        { calenderEvents: dbResponse }
    );
}