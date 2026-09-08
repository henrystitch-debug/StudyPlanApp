import { getUploadById } from "@/lib/db/upload";

// GEÄNDERT: statt "courseId: number" (der Name war ohnehin falsch - die Funktion
// sucht per uploadId) nimmt der Handler jetzt ein Request-Objekt entgegen.
// Next.js ruft GET-Route-Handler immer mit (request: Request) auf, nie mit
// eigenen Parametern.
export async function GET(request: Request) {

    // NEU: uploadId wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/upload/uploadGetById?uploadId=1
    const { searchParams } = new URL(request.url);
    const uploadId = Number(searchParams.get("uploadId"));

    // NEU: Validierung - fehlt uploadId oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!uploadId || Number.isNaN(uploadId)) {
        return Response.json({ error: "uploadId is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getUploadById eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getUploadById(uploadId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein Upload gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "Upload not found" }, { status: 404 });
    }

    return Response.json(
        { upload: dbResponse }
    );
}