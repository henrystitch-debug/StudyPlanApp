import { getTopicIndex } from "@/src/lib/db/topicItem";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const uploadId = Number(searchParams.get("uploadId"));

    if (!uploadId || Number.isNaN(uploadId)) {
        return Response.json({ error: "uploadId is required" }, { status: 400 });
    }

    const dbResponse = await getTopicIndex(uploadId);

    if (!dbResponse) {
        return Response.json({ error: "No topic index found" }, { status: 404 });
    }

    return Response.json(
        { topicIndex: dbResponse }
    );
}