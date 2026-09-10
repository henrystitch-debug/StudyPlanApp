import { pool } from "./client";
import { QuizItemsQA } from "@/types/quizItem";
import { QuizItemsMCQ } from "@/types/quizItem";

// ===============================================
// GET quizitem
//================================================
export async function getQuizItemById(quizItemId: number){

    const result = await pool.query(
    'SELECT * FROM quiz_item WHERE quiz_item_id = $1',
    [quizItemId]
  );
  return result.rows[0] ?? null;
}

// ===============================================
// GET quiz
//================================================
export async function getQuizItems(quizId: number){

    const result = await pool.query(
    'SELECT * FROM quiz_item WHERE quiz_id = $1',
    [quizId]
  );
  return result.rows ?? null;
}

// ===============================================
// GET quizzes of course
//================================================
export async function getQuizzesOverviewForCourse(courseId: number) {
  const result = await pool.query(
    `SELECT
       q.quiz_id,
       q.quiz_type,
       q.upload_id,
       s.title AS topic_title
     FROM quiz q
     JOIN upload u ON q.upload_id = u.upload_id
     LEFT JOIN summary s ON s.upload_id = u.upload_id
     WHERE u.course_id = $1
     ORDER BY u.upload_id, q.quiz_type`,
    [courseId]
  );
  return result.rows ?? null;
}

type QuizType = 'flashcards' | 'mcq' | 'freetext';

async function insertQuiz(client: any, uploadId: number, quizType: QuizType): Promise<number> {
  const result = await client.query(
    `INSERT INTO quiz (quiz_id, upload_id, quiz_type)
     VALUES (DEFAULT, $1, $2)
     RETURNING quiz_id`,
    [uploadId, quizType]
  );
  return result.rows[0].quiz_id;
}

async function insertQuizItems(
  client: any,
  quizId: number,
  items: { question: string; answer: unknown }[]
) {
  if (items.length === 0) return [];

  const values: string[] = [];
  const params: unknown[] = [];
  items.forEach((item, i) => {
    const base = i * 3;
    values.push(`(DEFAULT, $${base + 1}, $${base + 2}, $${base + 3})`);
    params.push(quizId, item.question, JSON.stringify(item.answer));
  });

  const result = await client.query(
    `INSERT INTO quiz_item (quiz_item_id, quiz_id, question, answer)
     VALUES ${values.join(', ')}
     RETURNING *`,
    params
  );
  return result.rows;
}

// ===============================================
// SAVE quizzes
//================================================
export async function saveQuizItems(
  uploadId: number,
  flashcards: QuizItemsQA,
  mcq: QuizItemsMCQ,
  freeText: QuizItemsQA
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const flashcardQuizId = await insertQuiz(client, uploadId, 'flashcards');
    const mcqQuizId = await insertQuiz(client, uploadId, 'mcq');
    const freeTextQuizId = await insertQuiz(client, uploadId, 'freetext');

    const flashcardRows = await insertQuizItems(
      client,
      flashcardQuizId,
      flashcards.map((f) => ({ question: f.question, answer: f.answer }))
    );

    const mcqRows = await insertQuizItems(
      client,
      mcqQuizId,
      mcq.map((m) => ({
        question: m.question,
        answer: {
          options: [m.answerA, m.answerB, m.answerC, m.answerD],
          correct: m.correctIndex,
        },
      }))
    );

    const freeTextRows = await insertQuizItems(
      client,
      freeTextQuizId,
      freeText.map((f) => ({ question: f.question, answer: f.answer }))
    );

    await client.query('COMMIT');
    return { flashcardRows, mcqRows, freeTextRows };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteQuiz(quizId: number) {
  const result = await pool.query(
    'DELETE FROM quiz WHERE quiz_id = $1 RETURNING quiz_id',
    [quizId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}
