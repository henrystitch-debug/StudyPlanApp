import { updateUserAvatar } from "@/lib/db/user";

export async function PUT(request: Request) {
    try {
        const { userId, avatar } = await request.json();
        const id = Number(userId);

        if (!id || Number.isNaN(id)) {
            return Response.json({ error: "userId is required" }, { status: 400 });
        }
        if (avatar !== null && typeof avatar !== "string") {
            return Response.json({ error: "avatar must be a string or null" }, { status: 400 });
        }

        const updated = await updateUserAvatar(id, avatar);

        if (!updated) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({ user: updated });
    } catch (err) {
        console.error(err);
        return Response.json({ error: "Error while updating avatar" }, { status: 500 });
    }
}
