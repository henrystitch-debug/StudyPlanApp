import { getSummaryById } from "@/lib/db/summary";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const summaryId = Number(searchParams.get("id"));

    if (!summaryId || Number.isNaN(summaryId)) {
        return Response.json({ error: "id is required" }, { status: 400 });
    }

    const dbResponse = await getSummaryById(summaryId);

    if (!dbResponse) {
        return Response.json({ error: "No summary found" }, { status: 404 });
    }

    return Response.json(
        { summary: dbResponse }
    );
}
