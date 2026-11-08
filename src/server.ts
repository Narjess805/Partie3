import express from "express";
import { Pool } from "pg";
import os from "os";

const app = express();
const port = Number(process.env.PORT ?? 3000);

const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", host: os.hostname() });
  } catch (err) {
    res.status(500).json({ status: "error", error: String(err) });
  }
});

app.get("/", async (_req, res) => {
  try {
    await pool.query("INSERT INTO visits DEFAULT VALUES");
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM visits");
    res.json({ visits: rows[0].count, host: os.hostname() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

initDb()
  .then(() => app.listen(port, () => console.log(`Server listening on :${port}`)))
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
