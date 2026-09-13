import { deleteStudyPlanItem } from "@/lib/db/studyplan";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);

  if (!itemId || Number.isNaN(itemId)) {
    return Response.json({ error: "itemId is required" }, { status: 400 });
  }

  const deleted = await deleteStudyPlanItem(itemId);

  if (!deleted) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}