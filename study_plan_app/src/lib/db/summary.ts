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
0

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

    const result = await pool.query(
    'INSERT INTO summary (summary_id, upload_Id, title, content) VALUES (DEFAULT, $1, $2, $3) RETURNING *',
    [uploadId, title, summary]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// DELETE summary (and topicIndex)
//================================================
export async function deleteSummary(sumId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const summaryResult = await client.query(
      'DELETE FROM summary WHERE summary_id = $1 RETURNING upload_id',
      [sumId]
    );

    if (!summaryResult.rowCount) {
      await client.query('ROLLBACK');
      return null; 
    }

    const uploadId = summaryResult.rows[0].upload_id;

    await client.query(
      'DELETE FROM topic_item WHERE upload_id = $1',
      [uploadId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}