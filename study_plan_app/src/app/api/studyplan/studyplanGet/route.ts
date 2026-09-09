import { getStudyplanById } from "@/lib/db/studyplan";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));

    if (!courseId || Number.isNaN(courseId)) {
        return Response.json({ error: "courseId is required" }, { status: 400 });
    }

    const dbResponse = await getStudyplanById(courseId);

    if (!dbResponse) {
        return Response.json({ error: "No studyplan found" }, { status: 404 });
    }

    return Response.json(
        { studyPlan: dbResponse }
    );
}
