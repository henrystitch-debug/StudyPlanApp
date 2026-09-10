import { pool } from "./client";
import { TopicIndex } from "@/src/types/topicIndex";


// ===============================================
// GET Topic Index
//================================================
export async function getTopicIndex(uploadId: number){

     const result = await pool.query(
    'SELECT * FROM topic_item WHERE upload_id = $1',
    [uploadId]
  );
  return result.rows ?? null;
}


// ===============================================
// GET ALL Topic Indices 
//================================================
export async function getAllTopicIndicesOfCourse(courseId: number){

  const result = await pool.query(
    `SELECT ti.topic_item_id, ti.upload_id, ti.title, ti.description, ti.location, ti.estimated_effort
     FROM topic_item ti
     JOIN upload u ON ti.upload_id = u.upload_id
     WHERE u.course_id = $1
     ORDER BY ti.upload_id, ti.topic_item_id`,
    [courseId]
  );
  return result.rows;
}


// ===============================================
// SAVE Topic Index
//================================================
export async function saveTopicIndex(uploadId: number, topicIndex: TopicIndex) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kein UNIQUE-Constraint auf topic_item.upload_id - ohne dieses Löschen
    // würde ein erneuter Versuch (Regenerieren) die alten Themen einfach
    // stehen lassen und die neuen daneben duplizieren.
    await client.query('DELETE FROM topic_item WHERE upload_id = $1', [uploadId]);

    if (topicIndex.length === 0) {
      await client.query('COMMIT');
      return { success: true, items: [] };
    }

    const values: string[] = [];
    const params: unknown[] = [];
    topicIndex.forEach((item, i) => {
      const base = i * 5;
      values.push(`(DEFAULT, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(uploadId, item.title, item.description, item.location, item.effort);
    });

    const result = await client.query(
      `INSERT INTO topic_item (topic_item_id, upload_id, title, description, location, estimated_effort)
       VALUES ${values.join(', ')}
       RETURNING *`,
      params
    );

    await client.query('COMMIT');
    return { success: true, items: result.rows };
  } catch (err) {
    await client.query('ROLLBACK');
    return { success: false, error: (err as Error).message };
  } finally {
    client.release();
  }
}
