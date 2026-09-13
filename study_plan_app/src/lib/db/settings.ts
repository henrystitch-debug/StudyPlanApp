import { pool } from "./client";

// ===============================================
// GET settings
//================================================
export async function getSettingsByUserId(userId: number){

    const result = await pool.query(
    'SELECT * FROM settings WHERE settings_id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE settings
//================================================
export async function updateSettings(userId: number, push: boolean, darkMode: boolean){

     const result = await pool.query(
    `UPDATE settings
     SET push_notifications = $1,
     dark_mode = $2
     WHERE settings_id = $3
     RETURNING *`,
    [push, darkMode, userId]
  );
  return result.rows[0] ?? null;
}