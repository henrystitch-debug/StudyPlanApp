import { deleteUpload } from "@/lib/db/upload";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId: uploadIdParam } = await params;
  const uploadId = Number(uploadIdParam);

  if (!uploadId || Number.isNaN(uploadId)) {
    return Response.json({ error: "uploadId is required" }, { status: 400 });
  }

  const deleted = await deleteUpload(uploadId);

  if (!deleted) {
    return Response.json({ error: "Upload not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}