import { pool } from "./client";

// ===============================================
// SAVE upload
//================================================
export async function saveUpload(courseId: number, file: File){

 const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await pool.query(
    'INSERT INTO upload (upload_id, course_id, file_name, mime_type, data ) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *',
    [courseId, file.name, file.type, buffer]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// GET ALL uploads
//================================================
export async function getUploadsByCourseId(courseId: number){
    
  const result = await pool.query(
    `SELECT upload_id, file_name, mime_type, uploaded_at
     FROM upload
     WHERE course_id = $1
     ORDER BY uploaded_at DESC`,
    [courseId]
  );
  return result.rows ?? null;
}

// ===============================================
// GET upload
//================================================
export async function getUploadById(uploadId: number){

   const result = await pool.query(
    `SELECT *
     FROM upload
     WHERE upload_id = $1`,
    [uploadId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// DELETE upload
//================================================
export async function deleteUpload(uploadId: number) {
  const result = await pool.query(
    'DELETE FROM upload WHERE upload_id = $1 RETURNING upload_id',
    [uploadId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}
