import { createCourse } from "@/lib/db/course";

export async function POST(request: Request) {
  try {
    const { userId, title, semester } = await request.json();

    if (!userId || !title || !semester) {
      return Response.json(
        { error: "userId, title, and semester are required" },
        { status: 400 }
      );
    }

    const course = await createCourse(userId, title, semester);
    return Response.json({ course });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error creating course" }, { status: 500 });
  }
}