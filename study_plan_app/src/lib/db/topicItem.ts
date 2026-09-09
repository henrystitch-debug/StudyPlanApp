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
  if (topicIndex.length === 0) return { success: true, items: [] };

  const values: string[] = [];
  const params: unknown[] = [];
  topicIndex.forEach((item, i) => {
    const base = i * 5;
    values.push(`(DEFAULT, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
    params.push(uploadId, item.title, item.description, item.location, item.effort);
  });

  const result = await pool.query(
    `INSERT INTO topic_item (topic_item_id, upload_id, title, description, location, estimated_effort)
     VALUES ${values.join(', ')}
     RETURNING *`,
    params
  );

  return { success: true, items: result.rows };
}
