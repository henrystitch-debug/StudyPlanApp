import { getSummaryTitlesForCourse } from "@/lib/db/summary";

export async function GET (request: Request){
    try {
        const { searchParams } = new URL(request.url);
        const courseId = Number(searchParams.get("courseId"));

        if (!courseId || Number.isNaN(courseId)) {
            return Response.json({ error: "courseId is required" }, { status: 400 });
        }

        const dbResponse = await getSummaryTitlesForCourse(courseId);

        if(!dbResponse){
            return Response.json({ error: "No titles found" }, { status: 404 });
        }

        return Response.json(
            {titles: dbResponse}
        )
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Error while fetching summary titles" },
            { status: 500 }
        );
    }
}
