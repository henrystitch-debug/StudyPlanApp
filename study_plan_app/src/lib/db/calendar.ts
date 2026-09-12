import { pool } from "./client";

// ===============================================
// GET events today
//================================================
export async function getTodaysEventsByUserId(userId : number, date: string) {
 
    const result = await pool.query(
    `SELECT * FROM events WHERE user_id = $1 AND event_date = $2`,
     [userId, date]
  );
  return result.rows ?? null;;
}

// ===============================================
// GET ALL events / user
//================================================
export async function getAllEventsByUserId(userId : number) {
 
    const result = await pool.query(
    `SELECT * FROM events WHERE user_id = $1`,
     [userId]
  );
  return result.rows ?? null;;
}

// ===============================================
// GET ALL events / course
//================================================
export async function getAllEventsOfCourse(userId : number, courseId: number) {
 
    const result = await pool.query(
    `SELECT * FROM events WHERE user_id = $1 AND course_id = $2`,
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
export async function createEvent(eventDate: Date, startTime: string, endTime: string, description: string, type: string, aiGenerated: boolean) {
  const result = await pool.query(
    `INSERT INTO event (id, event_date, start_time, end_time, description, type, ai_generated)
     VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [eventDate, startTime, endTime, description, type, aiGenerated]
  );
  return result.rows[0];
}

// ===============================================
// UPDATE event
//================================================
export async function updateEvent(eventId: number, eventDate: Date, startTime: string, endTime: string, description: string, type: string){

     const result = await pool.query(
    `UPDATE event
     SET event_date = $1,
     start_time = $2,
     end_time = $3, 
     description = $4, 
     type = $5
     WHERE event_id = $6
     RETURNING *`,
    [eventDate, startTime, endTime, description, type, eventId]
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