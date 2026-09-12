import { updateStudyPlanItemCompletion } from "@/lib/db/studyplan";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string, isCompleted: boolean }> }
) {
  const { itemId: itemIdParam, isCompleted: isCompletedParam } = await params;
  const itemId = Number(itemIdParam);
  const isCompleted = isCompletedParam;

  if (!itemId || Number.isNaN(itemId) || !isCompleted) {
    return Response.json({ error: "itemId and isCompleted information is required" }, { status: 400 });
  }

  const updatedItem = await updateStudyPlanItemCompletion(itemId, isCompleted);

  if (!updatedItem) {
    return Response.json({ error: "Item not found or no fields provided" }, { status: 404 });
  }

  return Response.json({ course: updatedItem });
}