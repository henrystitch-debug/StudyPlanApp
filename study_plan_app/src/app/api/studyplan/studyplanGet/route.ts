import { getStudyplanById } from "@/lib/db/studyplan";

// GEÄNDERT: statt "courseId: number" nimmt der Handler jetzt ein Request-Objekt
// entgegen. Next.js ruft GET-Route-Handler immer mit (request: Request) auf,
// nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: courseId wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/studyplan/studyplanGet?courseId=1
    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));

    // NEU: Validierung - fehlt courseId oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!courseId || Number.isNaN(courseId)) {
        return Response.json({ error: "courseId is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getStudyplanById eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getStudyplanById(courseId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein Studyplan gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "No studyplan found" }, { status: 404 });
    }

    return Response.json(
        { studyPlan: dbResponse }
    );
}
