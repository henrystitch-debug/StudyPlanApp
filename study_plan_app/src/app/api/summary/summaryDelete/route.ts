import { deleteSummary } from "@/lib/db/summary";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId: summaryIdParam } = await params;
  const summaryId = Number(summaryIdParam);

  if (!summaryId || Number.isNaN(summaryId)) {
    return Response.json({ error: "summaryId is required" }, { status: 400 });
  }

  const deleted = await deleteSummary(summaryId);

  if (!deleted) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}