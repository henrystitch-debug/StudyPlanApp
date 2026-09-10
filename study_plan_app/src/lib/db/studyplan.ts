import { pool } from "./client";
import { AiStudyplanResponse } from "@/types/studyplan";

export async function getStudyplanById(courseId: number){

  const result = await pool.query(
    `SELECT spi.*
     FROM study_plan_item spi
     JOIN study_plan sp ON spi.study_plan_id = sp.study_plan_id
     WHERE sp.course_id = $1
     ORDER BY spi.study_plan_item_id`,
    [courseId]
  );
  return result.rows;
}

function calculateEstimatedMinutes(startTime: string, endTime: string): number {
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const diff = toMinutes(endTime) - toMinutes(startTime);
  return diff >= 0 ? diff : diff + 24 * 60; // handles the (unlikely) case of crossing midnight
}

// ===============================================
// SAVE Studyplan
//================================================
export async function saveStudyplan(
  userId: number,
  courseId: number,
  studyplan: AiStudyplanResponse
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get or create the study_plan row for this course (one per course)
    const planResult = await client.query(
      `INSERT INTO study_plan (study_plan_id, course_id)
       VALUES (DEFAULT, $1)
       ON CONFLICT (course_id) DO UPDATE SET course_id = EXCLUDED.course_id
       RETURNING study_plan_id`,
      [courseId]
    );
    const studyPlanId = planResult.rows[0].study_plan_id;

    // 2. Clear old items AND their linked calendar events (regeneration case)
        await client.query(
        `DELETE FROM event
        WHERE event_id IN (
            SELECT event_id FROM study_plan_item
            WHERE study_plan_id = $1 AND event_id IS NOT NULL
        )`,
        [studyPlanId]
        );

        await client.query(
        `DELETE FROM study_plan_item WHERE study_plan_id = $1`,
        [studyPlanId]
        );

    // 3. Create an event + study_plan_item for each task
    const savedItems = [];
    for (const item of studyplan) {

      const eventResult = await client.query(
        `INSERT INTO event (event_id, user_id, course_id, event_date, start_time, end_time, event_type, description, ai_generated)
         VALUES (DEFAULT, $1, $2, $3, $4, $5, 'study_session', $6, TRUE)
         RETURNING event_id`,
        [userId, courseId, item.scheduledDate, item.startTime, item.endTime, item.description]
      );
      const eventId = eventResult.rows[0].event_id;

      const estimatedMinutes = calculateEstimatedMinutes(item.startTime, item.endTime);

      const itemResult = await client.query(
        `INSERT INTO study_plan_item (study_plan_item_id, study_plan_id, task_name, description, location, is_completed, estimated_minutes, event_id)
         VALUES (DEFAULT, $1, $2, $3, $4, FALSE, $5, $6)
         RETURNING *`,
        [
          studyPlanId,
          item.taskName,
          item.description,
          item.location,
          estimatedMinutes,
          eventId,
        ]
      );
      savedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');
    return { success: true, studyPlanId, items: savedItems };
  } catch (err) {
    await client.query('ROLLBACK');
    return { success: false, error: (err as Error).message };
  } finally {
    client.release();
  }
}

// ===============================================
// SAVE Studyplan
//================================================
export async function deleteStudyplan(courseId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planResult = await client.query(
      `SELECT study_plan_id FROM study_plan WHERE course_id = $1`,
      [courseId]
    );

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'No study plan found for this course' };
    }

    const studyPlanId = planResult.rows[0].study_plan_id;

    // Delete linked calendar events first
    await client.query(
      `DELETE FROM event
       WHERE event_id IN (
         SELECT event_id FROM study_plan_item
         WHERE study_plan_id = $1 AND event_id IS NOT NULL
       )`,
      [studyPlanId]
    );

    // Deleting study_plan cascades to study_plan_item automatically
    await client.query(
      `DELETE FROM study_plan WHERE study_plan_id = $1`,
      [studyPlanId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    return { success: false, error: (err as Error).message };
  } finally {
    client.release();
  }
}