import { updateCourse } from "@/lib/db/course";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string, title: string, description: string, semester: string}> }
) {
  const { courseId: courseIdParam, title: titleParam, description: descriptionParam, semester: semesterParam } = await params;
  const courseId = Number(courseIdParam);
  const title = titleParam;
  const description = descriptionParam;
  const semester = semesterParam;

  if (!courseId || Number.isNaN(courseId) || !title || !description || !semester) {
    return Response.json({ error: "course information is required" }, { status: 400 });
  }

  const updatedCourse = await updateCourse(courseId, title, description, semester);

  if (!updatedCourse) {
    return Response.json({ error: "Course not found or no fields provided" }, { status: 404 });
  }

  return Response.json({ course: updateCourse });
}