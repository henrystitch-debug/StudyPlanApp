import { deleteStudyplan } from "@/lib/db/studyplan";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = Number(searchParams.get("courseId"));

        if (!courseId || Number.isNaN(courseId)) {
            return Response.json({ error: "courseId is required" }, { status: 400 });
        }

        const dbResponse = await deleteStudyplan(courseId);

        if (!dbResponse || !dbResponse.success) {
            return Response.json({ error: "Studyplan not found" }, { status: 404 });
        }

        return Response.json(
            { success: true }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while deleting studyplan" },
            { status: 500 }
        );
    }
}
