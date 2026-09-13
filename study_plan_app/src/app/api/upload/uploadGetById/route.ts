import { getUploadById } from "@/lib/db/upload";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = Number(searchParams.get("uploadId"));

        if (!uploadId || Number.isNaN(uploadId)) {
            return Response.json({ error: "uploadId is required" }, { status: 400 });
        }

        const dbResponse = await getUploadById(uploadId);

        if (!dbResponse) {
            return Response.json({ error: "Upload not found" }, { status: 404 });
        }

        return Response.json(
            { upload: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching upload" },
            { status: 500 }
        );
    }
}
