import { getCoursesWithUploadCounts } from "@/lib/db/course";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));

  if (!userId || Number.isNaN(userId)) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const courses = await getCoursesWithUploadCounts(userId);
  return Response.json({ courses });
}