import { getQuizItemById } from "@/lib/db/quizItem";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const uploadid = Number(searchParams.get("uploadid"));
    const quizType = searchParams.get("quizType");
    const quizItemId = Number(searchParams.get("quizItemId"));

    if (!uploadid || Number.isNaN(uploadid) || !quizType || !quizItemId || Number.isNaN(quizItemId)) {
        return Response.json({ error: "uploadid, quizType and quizItemId are required" }, { status: 400 });
    }

    const dbResponse = await getQuizItemById(quizItemId);

    if (!dbResponse) {
        return Response.json({ error: "Quiz item not found" }, { status: 404 });
    }

    return Response.json(
        { quizItem: dbResponse }
    );
}
