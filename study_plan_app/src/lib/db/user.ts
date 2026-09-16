import { pool } from "./client";
import bcrypt from 'bcryptjs';

// ===============================================
// GET user by email
//================================================
export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT user_id, email, password_hash FROM app_user WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// CREATE user
//================================================
export async function createUser(email: string, plainPassword: string, name?: string) {
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let user;
    if(name){
      const userResult = await client.query(
      `INSERT INTO app_user (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, name`,
      [email, passwordHash, name]
    );
    user = userResult.rows[0];
    } else {
      const userResult = await client.query(
      `INSERT INTO app_user (email, password_hash)
       VALUES ($1, $2)
       RETURNING user_id, email`,
      [email, passwordHash]
    );
    user = userResult.rows[0];
    }

    // give every new user a default settings row too
    await client.query(
      `INSERT INTO settings (settings_id) VALUES ($1)`,
      [user.user_id]
    );

    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function verifyPassword(email: string, plainPassword: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(plainPassword, user.password_hash);
  if (!isMatch) return null;

  return { user_id: user.user_id, email: user.email }; // never return password_hash
}

// ===============================================
// GET user by id
//================================================
export async function getUserById(userId: number) {
  const result = await pool.query(
    `SELECT *
     FROM app_user
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}


// ===============================================
// UPDATE user (name)
//================================================
export async function updateUserName(userId: number, name: string){

 const result = await pool.query(
    `UPDATE app_user
     SET name = $1
     WHERE user_id = $2
     RETURNING *`,
    [name, userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE user (avatar)
//================================================
export async function updateUserAvatar(userId: number, avatar: string | null) {

 const result = await pool.query(
    `UPDATE app_user
     SET avatar = $1
     WHERE user_id = $2
     RETURNING *`,
    [avatar, userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE user (streak)
//================================================
export async function updateUserStreak(userId: number, streak: number){

 const result = await pool.query(
    `UPDATE app_user
     SET streak = $1
     WHERE user_id = $2
     RETURNING *`,
    [streak, userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE user password
//================================================
export async function updatePasswordByEmail(email: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    `UPDATE app_user SET password_hash = $1 WHERE email = $2 RETURNING user_id, email`,
    [passwordHash, email]
  );
  return result.rows[0] ?? null; // null if no account had that email
}


// ===============================================
// DELETE user
//================================================
export async function deleteUser(userId: number) {
  const result = await pool.query(
    'DELETE FROM app_user WHERE user_id = $1 RETURNING user_id',
    [userId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}

// ===============================================
// GET streak stats
//================================================
export async function getStreakStats(userId: number) {
  const userResult = await pool.query(
    `SELECT streak, longest_streak FROM app_user WHERE user_id = $1`,
    [userId]
  );
  if (!userResult.rows[0]) return null;
  const { streak, longest_streak } = userResult.rows[0];

  const weekStatsResult = await pool.query(
    `SELECT COUNT(*) AS quizzes_this_week, MAX(score) AS best_score_this_week
     FROM quiz_attempt
     WHERE user_id = $1
       AND attempt_date >= date_trunc('week', CURRENT_DATE)`,
    [userId]
  );
  const quizzesThisWeek = Number(weekStatsResult.rows[0].quizzes_this_week);
  const bestScoreThisWeek =
    weekStatsResult.rows[0].best_score_this_week !== null
      ? Number(weekStatsResult.rows[0].best_score_this_week)
      : null;

  // Real daily activity, last 12 weeks — how many quizzes were attempted each day.
  const activityResult = await pool.query(
    `SELECT DATE(attempt_date) AS day, COUNT(*) AS count
     FROM quiz_attempt
     WHERE user_id = $1
       AND attempt_date >= CURRENT_DATE - INTERVAL '83 days'
     GROUP BY DATE(attempt_date)`,
    [userId]
  );
  const countsByDate = new Map<string, number>();
for (const row of activityResult.rows) {
  const dateKey =
    row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10);
  countsByDate.set(dateKey, Number(row.count));
}

  const today = new Date();
  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() - today.getDay());
  const startSunday = new Date(currentWeekSunday);
  startSunday.setDate(startSunday.getDate() - 11 * 7); // 12 weeks total, ending this week

  const days: number[] = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(startSunday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    if (d > today) {
      days.push(-1); // future day — render as an empty cell, not "no activity"
      continue;
    }
    const count = countsByDate.get(key) ?? 0;
    days.push(count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3);
  }
  const activityWeeks: number[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    activityWeeks.push(days.slice(i, i + 7));
  }

  return {
    streak,
    longestStreak: longest_streak,
    quizzesThisWeek,
    bestScoreThisWeek,
    activityWeeks,
  };
}