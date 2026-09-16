import { pool } from "./client";

// ===============================================
// GET ALL courses
//================================================
export async function getAllCoursesOfUser(userId : number) {

  const result = await pool.query(
    'SELECT course_id, title, semester FROM course WHERE user_id = $1',
    [userId]
  );
  return result.rows ?? null;
}

// ===============================================
// GET course
//================================================
export async function getCourseInfo(userId: number, courseId: number) {
 
  const result = await pool.query(
    'SELECT * FROM course WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// CREATE course
//================================================
export async function createCourse(userId: number, title: string, semester: string) {
  const result = await pool.query(
    `INSERT INTO course (course_id, user_id, title, semester)
     VALUES (DEFAULT, $1, $2, $3)
     RETURNING *`,
    [userId, title, semester]
  );
  return result.rows[0];
}

// ===============================================
// UPDATE course
//================================================
export async function updateCourse(courseId: number, title: string, semester: string){

     const result = await pool.query(
    `UPDATE course
     SET title = $1,
     semester = $2
     WHERE course_id = $3
     RETURNING *`,
    [title, semester, courseId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// DELETE course
//================================================
export async function deleteCourse(courseId: number) {
  const result = await pool.query(
    'DELETE FROM course WHERE course_id = $1 RETURNING course_id',
    [courseId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}

// ===============================================
// GET upload count per course
//================================================
export async function getCoursesWithUploadCounts(userId: number) {
  const result = await pool.query(
    `SELECT
       c.course_id,
       c.title,
       c.semester,
       COUNT(DISTINCT u.upload_id) AS upload_count,
       MAX(u.uploaded_at) AS last_uploaded_at,
       COUNT(DISTINCT spi.study_plan_item_id) AS item_count,
       COUNT(DISTINCT spi.study_plan_item_id) FILTER (WHERE spi.is_completed) AS completed_item_count
     FROM course c
     LEFT JOIN upload u ON u.course_id = c.course_id
     LEFT JOIN study_plan sp ON sp.course_id = c.course_id
     LEFT JOIN study_plan_item spi ON spi.study_plan_id = sp.study_plan_id
     WHERE c.user_id = $1
     GROUP BY c.course_id
     ORDER BY c.course_id`,
    [userId]
  );
  return result.rows;
}