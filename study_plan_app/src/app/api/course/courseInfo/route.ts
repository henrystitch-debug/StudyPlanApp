import { getCourseInfo } from "@/lib/db/course";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const courseId = Number(searchParams.get("courseId"));

    if (!userId || Number.isNaN(userId) || !courseId || Number.isNaN(courseId)) {
        return Response.json({ error: "userId and courseId are required" }, { status: 400 });
    }

    const dbResponse = await getCourseInfo(userId, courseId);

    if (!dbResponse) {
        return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json(
        { courseInfo: dbResponse }
    );
}
