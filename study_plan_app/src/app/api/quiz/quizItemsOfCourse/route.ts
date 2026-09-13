import { getQuizItemsOfCourse } from "@/lib/db/quizItem";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));
    const type = searchParams.get("type");

    if (!courseId || Number.isNaN(courseId) || !type) {
        return Response.json({ error: "courseId and type are required" }, { status: 400 });
    }

    const dbResponse = await getQuizItemsOfCourse(courseId, type);

    if (!dbResponse) {
        return Response.json({ error: "No flashcards found" }, { status: 404 });
    }

    return Response.json(
        { flashcards: dbResponse }
    );
}
