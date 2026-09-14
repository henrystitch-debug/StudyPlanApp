import { getUserById } from "@/lib/db/user";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
        return Response.json({ error: "userId" }, { status: 400 });
    }

    const dbResponse = await getUserById(userId);

    if (!userId) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(
        { user: dbResponse }
    );
}
