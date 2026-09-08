import { getTodaysEventsByUserId } from "@/lib/db/calendar";

// GEÄNDERT: statt "id: number" nimmt der Handler jetzt ein Request-Objekt entgegen.
// Next.js ruft GET-Route-Handler immer mit (request: Request) auf, nie mit eigenen
// Parametern - "id" war vorher zur Laufzeit immer undefined.
export async function GET(request: Request) {

    // NEU: userId wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/calendar/calendarTodayEvents?userId=123
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    // NEU: Validierung - fehlt userId oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!userId || Number.isNaN(userId)) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getTodaysEventsByUserId eine async-Funktion ist
    // und ein Promise zurückgibt. Ohne await wäre dbResponse immer das Promise
    // selbst gewesen (truthy) statt der eigentlichen (Dummy-)Daten.
    const dbResponse = await getTodaysEventsByUserId(userId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls keine Events gefunden wurden.
    if (!dbResponse) {
        return Response.json({ error: "No events found" }, { status: 404 });
    }

    return Response.json(
        { calenderEvents: dbResponse }
    );
}
