import { pool } from './client';

// ===============================================
// GET summary
//================================================
export async function getSummaryById(uploadId: number){

    const result = await pool.query(
    'SELECT * FROM summary WHERE upload_id = $1',
    [uploadId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// GET ALL summaries
//================================================
export async function getSummaryTitlesForCourse(courseId: number) {
  const result = await pool.query(
    `SELECT s.summary_id, s.upload_id, s.title
     FROM summary s
     JOIN upload u ON s.upload_id = u.upload_id
     WHERE u.course_id = $1
     ORDER BY s.creation_date DESC`,
    [courseId]
  );
  return result.rows ?? null;
}

// ===============================================
// SAVE SUMMARY
//================================================
export async function saveSummary(uploadId: number, title: string, summary: string){

    // "summary" hat einen UNIQUE-Constraint auf upload_id - ohne Upsert würde
    // ein erneuter Versuch (z.B. nochmal auf "Summarize" klicken) für ein bereits
    // zusammengefasstes Dokument mit einem Duplicate-Key-Fehler abstürzen.
    const result = await pool.query(
    `INSERT INTO summary (summary_id, upload_Id, title, content)
     VALUES (DEFAULT, $1, $2, $3)
     ON CONFLICT (upload_id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content
     RETURNING *`,
    [uploadId, title, summary]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// DELETE summary
//================================================
export async function deleteSummary(sumId: number) {
  const result = await pool.query(
    'DELETE FROM summary WHERE summary_id = $1 RETURNING summary_id',
    [sumId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}