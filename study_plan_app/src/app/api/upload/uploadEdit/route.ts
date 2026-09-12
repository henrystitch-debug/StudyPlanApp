import { changeFilename } from "@/lib/db/upload";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ uploadId: string, newName: string }> }
) {
  const { uploadId: uploadIdParam, newName: newNameParam } = await params;
  const uploadId = Number(uploadIdParam);
  const newName = newNameParam;

  if (!uploadId || Number.isNaN(uploadId) || !newName) {
    return Response.json({ error: "uploadId and file name is required" }, { status: 400 });
  }

  const updatedUpload = await changeFilename(uploadId, newName);

  if (!updatedUpload) {
    return Response.json({ error: "Course not found or no fields provided" }, { status: 404 });
  }

  return Response.json({ filename: newName });
}