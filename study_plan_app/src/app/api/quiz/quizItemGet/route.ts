import { getQuizItemById } from "@/src/lib/db/quizItem";

// GEÄNDERT: statt "uploadid, quizType, quizItemId" als Parameter nimmt der Handler
// jetzt ein Request-Objekt entgegen. Next.js ruft GET-Route-Handler immer mit
// (request: Request) auf, nie mit eigenen Parametern.
export async function GET(request: Request) {

    // NEU: uploadid, quizType und quizItemId werden aus den Query-Parametern der
    // URL gelesen, z.B. /api/quizItem/quizItemGet?uploadid=1&quizType=abc&quizItemId=2
    const { searchParams } = new URL(request.url);
    const uploadid = Number(searchParams.get("uploadid"));
    const quizType = searchParams.get("quizType");
    const quizItemId = Number(searchParams.get("quizItemId"));

    // NEU: Validierung - fehlt einer der Parameter oder ist ungültig,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!uploadid || Number.isNaN(uploadid) || !quizType || !quizItemId || Number.isNaN(quizItemId)) {
        return Response.json({ error: "uploadid, quizType and quizItemId are required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getQuizItemById eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getQuizItemById(uploadid, quizType, quizItemId);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein Quiz-Item gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "Quiz item not found" }, { status: 404 });
    }

    return Response.json(
        { quizItem: dbResponse }
    );
}
