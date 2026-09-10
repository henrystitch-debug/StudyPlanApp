import { pool } from "./client";

// ===============================================
// CREATE quiz attempt
//================================================
 export async function createQuizAttempt(quizId: number, userId: number, score: number) {
  const result = await pool.query(
    `INSERT INTO quiz_attempt (quiz_attempt_id, quiz_id, user_id, score)
     VALUES (DEFAULT, $1, $2, $3)
     RETURNING *`,
    [quizId, userId, score]
  );
  return result.rows[0];
}

// ===============================================
// CREATE item attempt
//================================================
export async function createItemAttempts(
  quizAttemptId: number,
  items: { quizItemId: number; score: number; level?: string }[]
) {
  if (items.length === 0) return [];

  const values: string[] = [];
  const params: unknown[] = [];
  items.forEach((item, i) => {
    const base = i * 4;
    values.push(`(DEFAULT, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
    params.push(quizAttemptId, item.quizItemId, item.score, item.level ?? null);
  });

  const result = await pool.query(
    `INSERT INTO item_attempt (item_attempt_id, quiz_attempt_id, quiz_item_id, score, level)
     VALUES ${values.join(', ')}
     RETURNING *`,
    params
  );
  return result.rows;
}


// ===============================================
// GET quiz attempt history
//================================================
export async function getQuizAttemptHistory(quizId: number, userId: number) {
  const result = await pool.query(
    `SELECT quiz_attempt_id, score, attempt_date
     FROM quiz_attempt
     WHERE quiz_id = $1 AND user_id = $2
     ORDER BY attempt_date ASC`,
    [quizId, userId]
  );
  return result.rows;
}


// ===============================================
// GET items with lower score than 50 
//================================================
export async function getWeakItemsForQuiz(quizId: number, userId: number, threshold = 50) {
  const result = await pool.query(
    `SELECT
       qi.quiz_item_id,
       qi.question,
       AVG(ia.score) AS average_score,
       COUNT(ia.item_attempt_id) AS times_attempted
     FROM quiz_item qi
     JOIN item_attempt ia ON ia.quiz_item_id = qi.quiz_item_id
     JOIN quiz_attempt qa ON ia.quiz_attempt_id = qa.quiz_attempt_id
     WHERE qi.quiz_id = $1 AND qa.user_id = $2
     GROUP BY qi.quiz_item_id, qi.question
     HAVING AVG(ia.score) < $3
     ORDER BY average_score ASC`,
    [quizId, userId, threshold]
  );
  return result.rows;
}


// ===============================================
// GET item attempts for quiz attempt
//================================================
export async function getItemAttemptsForQuizAttempt(quizAttemptId: number) {
  const result = await pool.query(
    `SELECT ia.item_attempt_id, ia.quiz_item_id, ia.score, ia.level, qi.question
     FROM item_attempt ia
     JOIN quiz_item qi ON ia.quiz_item_id = qi.quiz_item_id
     WHERE ia.quiz_attempt_id = $1
     ORDER BY ia.item_attempt_id`,
    [quizAttemptId]
  );
  return result.rows;
}