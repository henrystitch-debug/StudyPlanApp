import { getUserById } from "@/lib/db/user";

// GEÄNDERT: statt "uid: number" nimmt der Handler jetzt ein Request-Objekt entgegen.
// Next.js ruft GET-Route-Handler immer mit (request: Request) auf, nie mit eigenen
// Parametern.
export async function GET(request: Request) {

    // NEU: uid wird aus dem Query-Parameter der URL gelesen,
    // z.B. /api/user?uid=1
    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));

    // NEU: Validierung - fehlt uid oder ist sie keine gültige Zahl,
    // gibt es jetzt einen sauberen 400-Fehler statt eines stillen "return;"
    if (!uid || Number.isNaN(uid)) {
        return Response.json({ error: "uid is required" }, { status: 400 });
    }

    // GEÄNDERT: "await" ergänzt, da getUserById eine async-Funktion ist
    // und ein Promise zurückgibt.
    const dbResponse = await getUserById(uid);

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls kein User gefunden wurde.
    if (!dbResponse) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(
        { userInfo: dbResponse }
    );
}
