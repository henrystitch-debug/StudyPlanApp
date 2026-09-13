import { createCourse } from "@/lib/db/course";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = Number(body.userId);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.description === "string" ? body.description : "";
        const semester = typeof body.semester === "string" ? body.semester : "";

        if (!userId || Number.isNaN(userId) || !title) {
            return Response.json({ error: "userId and title are required" }, { status: 400 });
        }

        const dbResponse = await createCourse(userId, title, description, semester);

        if (!dbResponse) {
            return Response.json({ error: "Error while creating course" }, { status: 500 });
        }

        return Response.json(
            { course: dbResponse }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while creating course" },
            { status: 500 }
        );
    }
}
