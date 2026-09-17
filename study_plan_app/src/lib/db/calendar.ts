import { pool } from "./client";

// ===============================================
// GET events today
//================================================
export async function getTodaysEventsByUserId(userId : number, date: string) {
 
    const result = await pool.query(
    `SELECT * FROM event WHERE user_id = $1 AND event_date = $2`,
     [userId, date]
  );
  return result.rows ?? null;;
}

// ===============================================
// GET ALL events / user
//================================================
export async function getAllEventsByUserId(userId : number) {
 
    const result = await pool.query(
    `SELECT * FROM event WHERE user_id = $1`,
     [userId]
  );
  return result.rows ?? null;;
}

// ===============================================
// GET ALL events / course
//================================================
export async function getAllEventsOfCourse(userId : number, courseId: number) {
 
    const result = await pool.query(
    `SELECT * FROM event WHERE user_id = $1 AND course_id = $2`,
     [userId, courseId]
  );
  return result.rows ?? null;;
}

// ===============================================
// GET events of specific range
//================================================
export async function getEventsInRange(userId : number, startDate: string, endDate: string) {
 
    const result = await pool.query(
    `SELECT * FROM event WHERE user_id = $1 AND event_date >= $2 AND event_date <= $3`,
     [userId, startDate, endDate]
  );
  return result.rows ?? null;;
}

// ===============================================
// CREATE event
//================================================
export async function createEvent(
  userId: number,
  eventDate: string,
  startTime: string,
  endTime: string,
  eventType: string,
  description: string | null,
  courseId: number | null
) {
  const result = await pool.query(
    `INSERT INTO event (user_id, event_date, start_time, end_time, event_type, description, course_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, eventDate, startTime, endTime, eventType, description, courseId]
  );
  return result.rows[0];
}

// ===============================================
// UPDATE event
//================================================
export async function updateEvent(
  eventId: number,
  eventDate: string,
  startTime: string,
  endTime: string,
  description: string | null,
  eventType: string,
  courseId: number | null
) {
  const result = await pool.query(
    `UPDATE event
     SET event_date = $1,
         start_time = $2,
         end_time = $3,
         description = $4,
         event_type = $5,
         course_id = $6
     WHERE event_id = $7
     RETURNING *`,
    [eventDate, startTime, endTime, description, eventType, courseId, eventId]
  );
  return result.rows[0];
}

// ===============================================
// DELETE event
//================================================
export async function deleteEvent(eventId: number) {
  const result = await pool.query(
    'DELETE FROM event WHERE event_id = $1 RETURNING event_id',
    [eventId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}