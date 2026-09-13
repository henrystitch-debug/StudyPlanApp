import { updateStudyPlanItemCompletion } from "@/lib/db/studyplan";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const itemId = Number(body.itemId);
        const isCompleted = Boolean(body.isCompleted);

        if (!itemId || Number.isNaN(itemId) || typeof body.isCompleted !== "boolean") {
            return Response.json({ error: "itemId and isCompleted are required" }, { status: 400 });
        }

        const updatedItem = await updateStudyPlanItemCompletion(itemId, isCompleted);

        if (!updatedItem) {
            return Response.json({ error: "Item not found" }, { status: 404 });
        }

        return Response.json(
            { item: updatedItem }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while updating study plan item" },
            { status: 500 }
        );
    }
}
