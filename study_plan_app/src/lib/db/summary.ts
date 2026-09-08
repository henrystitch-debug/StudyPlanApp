import { pool } from './db';

export async function getSummaryById(id: number){

    //TODO: fetch summary from db
    return "";
}

export async function getAllSummaryTitles(){

    //TODO: fetch summary titles from db
    return ["", "", ""];
}

export async function saveSummary(uploadId: number, title: string, summary: string){

    const result = await pool.query(
    'INSERT INTO summary (id, uploadId, title, summary) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *',
    [uploadId, title, summary]
  );
  return Response.json(result.rows[0]);
}