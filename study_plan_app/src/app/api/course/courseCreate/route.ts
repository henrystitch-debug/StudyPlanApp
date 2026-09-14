import { createCourse } from "@/lib/db/course";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const semester = typeof body.semester === "string" ? body.semester.trim() : "";

    // Semester ist im UI optional ("Semester (optional)") - deshalb hier nicht
    // erzwingen, nur userId und title sind Pflicht.
    if (!userId || Number.isNaN(userId) || !title) {
      return Response.json({ error: "userId and title are required" }, { status: 400 });
    }

    const course = await createCourse(userId, title, semester);

    if (!course) {
      return Response.json({ error: "Error while creating course" }, { status: 500 });
    }

    return Response.json({ course });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error while creating course" }, { status: 500 });
  }
}