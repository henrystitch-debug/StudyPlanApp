import { getAllTopicIndicesOfCourse } from "@/lib/db/topicItem";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = Number(searchParams.get("courseId"));

        if (!courseId || Number.isNaN(courseId)) {
            return Response.json({ error: "courseId is required" }, { status: 400 });
        }

        const dbResponse = await getAllTopicIndicesOfCourse(courseId);

        if (!dbResponse) {
            return Response.json({ error: "No topic items found" }, { status: 404 });
        }

        return Response.json(
            { topicItems: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching topic items" },
            { status: 500 }
        );
    }
}
