import { getSummaryById } from "@/src/lib/db/summary";

// GEÄNDERT: statt "id: number" nimmt der Handler jetzt ein Request-Objekt entgegen.
// Next.js ruft GET-Route-Handler immer mit (request: Request) auf, nie mit eigenen
// Parametern.
export async function GET(request: Request) {

    // NEU: summaryId wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/summary/summaryGet?id=1
    const { searchParams } = new URL(request.url);
    const summaryId = Number(searchParams.get("id"));

    // NEU: Validierung - fehlt id oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!summaryId || Number.isNaN(summaryId)) {
        return Response.json({ error: "id is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getSummaryById eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getSummaryById(summaryId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls keine Summary gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "No summary found" }, { status: 404 });
    }

    return Response.json(
        { summary: dbResponse }
    );
}
