import { getAllCoursesOfUser } from "@/lib/db/course";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId || Number.isNaN(userId)) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const dbResponse = await getAllCoursesOfUser(userId);

    if (!dbResponse) {
      return Response.json({ error: "No courses found" }, { status: 404 });
    }

    return Response.json({ courses: dbResponse });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error while fetching courses" }, { status: 500 });
  }
}