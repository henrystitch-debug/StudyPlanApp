import { getSpecificMessage } from "@/lib/db/message";

export async function GET(request: Request) {

    const formData = await request.formData(); 
        const message = formData.get("message") as string;

    if (!message) {
        return Response.json({ error: "message is required" }, { status: 400 });
    }

    const dbResponse = await getSpecificMessage(message);

    if (!dbResponse) {
        return Response.json({ error: "No message found" }, { status: 404 });
    }

    return Response.json(
        { message: dbResponse }
    );
}
