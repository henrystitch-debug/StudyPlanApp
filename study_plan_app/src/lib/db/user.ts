import { pool } from "./client";

// ===============================================
// GET user
//================================================
export async function getUserById(userId: number){
    
  const result = await pool.query(
    `SELECT *
     FROM app_user
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// CREATE user
//================================================
export async function saveUser(email: string, password: string){
    
  const result = await pool.query(
    'INSERT INTO app_user (user_id, e_mail, password_hash, streak) VALUES (DEFAULT, $1, $2, 0) RETURNING *',
    [email, password]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE user
//================================================
export async function updateUser(userId: number, name: string, streak: number){

 const result = await pool.query(
    `UPDATE app_user
     SET name = $1,
     streak = $2
     WHERE user_id = $3
     RETURNING *`,
    [name, streak, userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE user password
//================================================
export async function changePassword(userId: number, password: string){

 const result = await pool.query(
    `UPDATE app_user
     SET password = $1,
     WHERE user_id = $2
     RETURNING *`,
    [password, userId]
  );
  return result.rows[0] ?? null;
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

