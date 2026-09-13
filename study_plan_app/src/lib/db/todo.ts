import { pool } from './client';

// ===============================================
// GET todos of user
//================================================
export async function getToDosById(userId: number){

    const result = await pool.query(
    'SELECT * FROM to_do_list WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// UPDATE to do item
//================================================
export async function updateToDoItem(userId: number, toDoId: number, text: string, completed: boolean) {
  const result = await pool.query(
    `UPDATE to_do_list
     SET text = $1,
     completed = $2
     WHERE user_id = $3
     AND to_do_id = $4
     RETURNING *`,
    [text, completed, userId, toDoId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// DELETE to do item
//================================================
export async function deleteToDo(userId: number, toDoId: number,) {
  const result = await pool.query(
    `DELETE FROM to_do_list 
     WHERE user_id = $1
     AND to_do_id = $2
     RETURNING *`,
    [userId, toDoId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}

// ===============================================
// CREATE to do
//================================================
export async function createToDo(userId: number, text: string){

    const result = await pool.query(
    'INSERT INTO to_do_list (to_do_id, user_id, text, completed) VALUES (DEFAULT, $1, $2, FALSE) RETURNING *',
    [userId, text]
  );
  return result.rows[0] ?? null;
}
