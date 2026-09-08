import { getCourseInfo } from "@/src/lib/db/course";

// GEÄNDERT: statt "uid: number, courseId: number" nimmt der Handler jetzt ein
// Request-Objekt entgegen. Next.js ruft GET-Route-Handler immer mit
// (request: Request) auf, nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: uid und courseId werden aus den Query-Parametern der URL gelesen,
    // z.B. /api/course/courseInfo?uid=1&courseId=2
    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));
    const courseId = Number(searchParams.get("courseId"));

    // NEU: Validierung - fehlen uid/courseId oder sind sie keine gültigen Zahlen,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!uid || Number.isNaN(uid) || !courseId || Number.isNaN(courseId)) {
        return Response.json({ error: "uid and courseId are required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getCourseInfo eine async-Funktion ist
    // und ein Promise zurückgibt. Ohne await wäre dbResponse immer das Promise
    // selbst gewesen (truthy) statt der eigentlichen (Dummy-)Daten.
    const dbResponse = await getCourseInfo(uid, courseId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein Kurs gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json(
        { courseInfo: dbResponse }
    );
}
