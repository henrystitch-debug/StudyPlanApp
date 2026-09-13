import { getCourseInfo } from "@/lib/db/course";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));
    const courseId = Number(searchParams.get("courseId"));

    if (!uid || Number.isNaN(uid) || !courseId || Number.isNaN(courseId)) {
        return Response.json({ error: "uid and courseId are required" }, { status: 400 });
    }

    const dbResponse = await getCourseInfo(uid, courseId);

    if (!dbResponse) {
        return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json(
        { courseInfo: dbResponse }
    );
}
