import { getAllCoursesOfUser } from "@/lib/db/course";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid"));

    if (!uid || Number.isNaN(uid)) {
        return Response.json({ error: "uid is required" }, { status: 400 });
    }

    const dbResponse = await getAllCoursesOfUser(uid);

    if (!dbResponse) {
        return Response.json({ error: "No courses found" }, { status: 404 });
    }

    return Response.json(
        { courses: dbResponse }
    );
}
