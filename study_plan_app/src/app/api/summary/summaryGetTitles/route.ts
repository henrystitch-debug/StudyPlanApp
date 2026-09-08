import { getAllSummaryTitles } from "@/lib/db/summary";


// Signatur unverändert (kein Query-Parameter nötig), aber:
// GEÄNDERT: "await" ergänzt, da getAllSummaryTitles eine async-Funktion ist
// und ein Promise zurückgibt. Ohne await wäre dbResponse immer das Promise
// selbst gewesen (truthy) statt der eigentlichen (Dummy-)Daten.
export async function GET (){

    const dbResponse = await getAllSummaryTitles();

    // GEÄNDERT: statt leerem "return;" (undefined) gibt es jetzt eine echte
    // JSON-Fehlerantwort mit Statuscode 404, falls keine Titel gefunden wurden.
    if(!dbResponse){
        return Response.json({ error: "No titles found" }, { status: 404 });
    }

    return Response.json(
        {titles: dbResponse}
    )
}