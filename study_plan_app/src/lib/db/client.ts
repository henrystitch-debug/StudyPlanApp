import { Pool, types } from 'pg';

// OID 1082 = Postgres' "date"-Typ. node-postgres wandelt den sonst standardmäßig
// in ein JS-Date-Objekt um (lokale Mitternacht) - beim JSON-Serialisieren rutscht
// das durch die UTC-Umrechnung je nach Zeitzone einen Tag zurück (z.B. wird aus
// 2026-09-22 dann "2026-09-21T23:00:00.000Z"). Da ein reines Datum ohne Uhrzeit
// sowieso keine Zeitzone hat, wird der rohe "YYYY-MM-DD"-String durchgereicht.
types.setTypeParser(1082, (value: string) => value);

const globalForPool = globalThis as unknown as { pool: Pool };

export const pool = globalForPool.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;