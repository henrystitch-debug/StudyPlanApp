import { getStreakByUserId } from "@/lib/db/streak";

// Next.js ruft GET-Route-Handler immer mit (request: Request) auf, nie mit
// eigenen Parametern - siehe die anderen Routen in diesem Projekt.
export async function GET(request: Request) {

    // uid wird aus dem Query-Parameter der URL gelesen, z.B. /api/streak?uid=1
    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));

    if (!uid || Number.isNaN(uid)) {
        return Response.json({ error: "uid is required" }, { status: 400 });
    }

    const dbResponse = await getStreakByUserId(uid);

    if (!dbResponse) {
        return Response.json({ error: "No streak data found" }, { status: 404 });
    }

    return Response.json(
        { streak: dbResponse }
    );
}
