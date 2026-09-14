import { getUserById } from "@/lib/db/user";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = Number(searchParams.get("userId"));

        if (!userId || Number.isNaN(userId)) {
            return Response.json({ error: "userId is required" }, { status: 400 });
        }

        const dbResponse = await getUserById(userId);

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
