import { deleteCourse } from "@/lib/db/course";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId: courseIdParam } = await params;
  const courseId = Number(courseIdParam);

  if (!courseId || Number.isNaN(courseId)) {
    return Response.json({ error: "eventId is required" }, { status: 400 });
  }

  const deleted = await deleteCourse(courseId);

  if (!deleted) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}