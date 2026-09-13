import { deleteStudyplan } from "@/lib/db/studyplan";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ studyplanId: string }> }
) {
  const { studyplanId: studyplanIdParams } = await params;
  const studyplanId = Number(studyplanIdParams);

  if (!studyplanId || Number.isNaN(studyplanId)) {
    return Response.json({ error: "eventId is required" }, { status: 400 });
  }

  const deleted = await deleteStudyplan(studyplanId);

  if (!deleted) {
    return Response.json({ error: "Studyplan not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}