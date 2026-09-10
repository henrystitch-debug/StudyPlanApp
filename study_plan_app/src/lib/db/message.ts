import { pool } from "./client";

// ===============================================
// GET message
//================================================
export async function getSpecificMessage(title: string) {

    const result = await pool.query(
    'SELECT text FROM message WHERE message_name = $1',
    [title]
  );
  return result.rows[0] ?? null;
}
