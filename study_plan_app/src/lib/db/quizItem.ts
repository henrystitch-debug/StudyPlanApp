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

// ===============================================
// GET quiz overview across every course a user owns (Quizzes page)
//================================================
// One row per real quiz (upload + type), across all of the user's
// courses — attempt_count/average_score/best_score are 0/null for a quiz
// that's been generated but never taken (LEFT JOIN keeps it visible).
export async function getQuizOverviewForUser(userId: number) {
  const result = await pool.query(
    `SELECT
       q.quiz_id,
       q.quiz_type,
       u.upload_id,
       u.file_name AS topic_title,
       c.course_id,
       c.title AS course_title,
       COUNT(qa.quiz_attempt_id) AS attempt_count,
       AVG(qa.score) AS average_score,
       MAX(qa.score) AS best_score,
       MAX(qa.attempt_date) AS last_attempted
     FROM quiz q
     JOIN upload u ON q.upload_id = u.upload_id
     JOIN course c ON u.course_id = c.course_id
     LEFT JOIN quiz_attempt qa ON qa.quiz_id = q.quiz_id AND qa.user_id = $1
     WHERE c.user_id = $1
     GROUP BY q.quiz_id, q.quiz_type, u.upload_id, u.file_name, c.course_id, c.title
     ORDER BY c.title, u.file_name, q.quiz_type`,
    [userId]
  );
  return result.rows;
}

type QuizType = 'flashcards' | 'mcq' | 'freetext';

async function insertQuiz(client: any, uploadId: number, quizType: QuizType): Promise<number> {
  // "quiz" hat einen UNIQUE-Constraint auf (upload_id, quiz_type) - ohne Upsert würde
  // ein erneuter Klick auf "Quiz" für ein bereits generiertes Dokument mit einem
  // Duplicate-Key-Fehler abstürzen. Bei Konflikt wird die bestehende Zeile
  // wiederverwendet und ihre alten quiz_items werden unten ersetzt.
  const result = await client.query(
    `INSERT INTO quiz (quiz_id, upload_id, quiz_type)
     VALUES (DEFAULT, $1, $2)
     ON CONFLICT (upload_id, quiz_type) DO UPDATE SET quiz_type = EXCLUDED.quiz_type
     RETURNING quiz_id`,
    [uploadId, quizType]
  );
  const quizId = result.rows[0].quiz_id;

  // Alte Items dieses Quiz-Typs entfernen, damit ein Regenerieren sie ersetzt
  // statt zu verdoppeln.
  await client.query('DELETE FROM quiz_item WHERE quiz_id = $1', [quizId]);

  return quizId;
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
          options: m.options,
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

// ===============================================
// GET saved quiz (flashcards + mcq + freetext) for an upload
//================================================
export async function getQuizForUpload(uploadId: number) {
  const quizzes = await pool.query(
    'SELECT quiz_id, quiz_type FROM quiz WHERE upload_id = $1',
    [uploadId]
  );

  if (quizzes.rows.length === 0) return null;

  const quiz: {
    flashcards: { quizItemId: number; question: string; answer: string }[];
    mcq: { quizItemId: number; question: string; options: string[]; correctIndex: number }[];
    openText: { quizItemId: number; question: string; modelAnswer: string }[];
    // quiz_id per type, so a finished session can be recorded against the
    // right quiz for createQuizAttempt — null for a type that was never
    // generated for this upload.
    quizIds: { flashcards: number | null; mcq: number | null; freetext: number | null };
  } = { flashcards: [], mcq: [], openText: [], quizIds: { flashcards: null, mcq: null, freetext: null } };

  for (const row of quizzes.rows) {
    const items = await pool.query(
      'SELECT quiz_item_id, question, answer FROM quiz_item WHERE quiz_id = $1',
      [row.quiz_id]
    );

    if (row.quiz_type === 'flashcards') {
      quiz.flashcards = items.rows.map((i) => ({ quizItemId: i.quiz_item_id, question: i.question, answer: i.answer }));
      quiz.quizIds.flashcards = row.quiz_id;
    } else if (row.quiz_type === 'mcq') {
      quiz.mcq = items.rows.map((i) => ({
        quizItemId: i.quiz_item_id,
        question: i.question,
        options: i.answer?.options ?? [],
        correctIndex: i.answer?.correct ?? 0,
      }));
      quiz.quizIds.mcq = row.quiz_id;
    } else if (row.quiz_type === 'freetext') {
      quiz.openText = items.rows.map((i) => ({ quizItemId: i.quiz_item_id, question: i.question, modelAnswer: i.answer }));
      quiz.quizIds.freetext = row.quiz_id;
    }
  }

  return quiz;
}

export async function deleteQuiz(quizId: number) {
  const result = await pool.query(
    'DELETE FROM quiz WHERE quiz_id = $1 RETURNING quiz_id',
    [quizId]
  );
  if(!result.rowCount){ return null}
  return result.rowCount > 0;
}
