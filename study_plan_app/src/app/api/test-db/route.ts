// src/app/api/test-db/route.ts
import { pool } from '@/src/lib/db/client';

export async function GET() {
  const result = await pool.query('SELECT NOW()');
  return Response.json({ success: true, time: result.rows[0] });
}