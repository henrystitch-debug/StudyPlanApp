import { getQuizItemsOfCourse } from "@/lib/db/quizItem";

// GEÄNDERT: statt "courseId: number, type: string" nimmt der Handler jetzt ein
// Request-Objekt entgegen. Next.js ruft GET-Route-Handler immer mit
// (request: Request) auf, nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: courseId und type werden aus den Query-Parametern der URL gelesen,
    // z.B. /api/quizItem/quizItemsOfCourse?courseId=1&type=flashcard
    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));
    const type = searchParams.get("type");

    // NEU: Validierung - fehlt courseId/type oder ist courseId ungültig,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!courseId || Number.isNaN(courseId) || !type) {
        return Response.json({ error: "courseId and type are required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getQuizItemsOfCourse eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getQuizItemsOfCourse(courseId, type);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls keine Flashcards gefunden wurden.
    if (!dbResponse) {
        return Response.json({ error: "No flashcards found" }, { status: 404 });
    }

    return Response.json(
        { flashcards: dbResponse }
    );
}
