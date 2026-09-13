import { getUserById } from "@/lib/db/user";

export async function GET(request: Request) {
    try {
        // uid wird aus dem Query-Parameter der URL gelesen, z.B. /api/streak?uid=1
        const { searchParams } = new URL(request.url);
        const uid = Number(searchParams.get("uid"));

        if (!uid || Number.isNaN(uid)) {
            return Response.json({ error: "uid is required" }, { status: 400 });
        }

        const dbResponse = await getUserById(uid);

        if (!dbResponse) {
            return Response.json({ error: "No streak data found" }, { status: 404 });
        }

        return Response.json(
            { streak: dbResponse.streak, longestStreak: dbResponse.longestStreak }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching streak" },
            { status: 500 }
        );
    }
}
