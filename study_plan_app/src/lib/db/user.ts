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

