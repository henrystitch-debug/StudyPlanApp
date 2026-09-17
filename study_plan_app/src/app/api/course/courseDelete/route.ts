import { deleteCourse } from "@/lib/db/course";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = Number(searchParams.get("courseId"));

  if (!courseId || Number.isNaN(courseId)) {
    return Response.json({ error: "courseId is required" }, { status: 400 });
  }

  const deleted = await deleteCourse(courseId);

  if (!deleted) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}