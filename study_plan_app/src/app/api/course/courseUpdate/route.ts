import { updateCourse } from "@/lib/db/course";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const courseId = Number(body.courseId);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.description === "string" ? body.description : "";
        const semester = typeof body.semester === "string" ? body.semester : "";

        if (!courseId || Number.isNaN(courseId) || !title) {
            return Response.json({ error: "courseId and title are required" }, { status: 400 });
        }

        const dbResponse = await updateCourse(courseId, title, description, semester);

        if (!dbResponse) {
            return Response.json({ error: "Course not found" }, { status: 404 });
        }

        return Response.json(
            { course: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while updating course" },
            { status: 500 }
        );
    }
}
