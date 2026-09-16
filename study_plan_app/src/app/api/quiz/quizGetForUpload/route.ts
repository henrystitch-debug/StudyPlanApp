import { getQuizForUpload } from "@/lib/db/quizItem";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = Number(searchParams.get("uploadId"));

        if (!uploadId || Number.isNaN(uploadId)) {
            return Response.json({ error: "uploadId is required" }, { status: 400 });
        }

        const dbResponse = await getQuizForUpload(uploadId);

        if (!dbResponse) {
            return Response.json({ error: "No quiz found" }, { status: 404 });
        }

        return Response.json(
            { quiz: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching quiz" },
            { status: 500 }
        );
    }
}
