import { getTopicIndex } from "@/lib/db/topicIndex";

// GEÄNDERT: statt "uploadId: number" nimmt der Handler jetzt ein Request-Objekt
// entgegen. Next.js ruft GET-Route-Handler immer mit (request: Request) auf,
// nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: uploadId wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/topicIndexGet?uploadId=1
    const { searchParams } = new URL(request.url);
    const uploadId = Number(searchParams.get("uploadId"));

    // NEU: Validierung - fehlt uploadId oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!uploadId || Number.isNaN(uploadId)) {
        return Response.json({ error: "uploadId is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getTopicIndex eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getTopicIndex(uploadId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein Topic-Index gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "No topic index found" }, { status: 404 });
    }

    return Response.json(
        { topicIndex: dbResponse }
    );
}