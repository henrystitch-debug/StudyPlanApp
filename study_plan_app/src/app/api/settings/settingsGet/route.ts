import { getSettingsByUserId } from "@/lib/db/settings";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const dbResponse = await getSettingsByUserId(userId);

    if (!dbResponse) {
        return Response.json({ error: "No settings found" }, { status: 404 });
    }

    return Response.json(
        { quizItem: dbResponse }
    );
}
