import { deleteSummary } from "@/lib/db/summary";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const summaryId = Number(searchParams.get("id"));

        if (!summaryId || Number.isNaN(summaryId)) {
            return Response.json({ error: "id is required" }, { status: 400 });
        }

        const dbResponse = await deleteSummary(summaryId);

        if (!dbResponse) {
            return Response.json({ error: "Summary not found" }, { status: 404 });
        }

        return Response.json(
            { success: true }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while deleting summary" },
            { status: 500 }
        );
    }
}
