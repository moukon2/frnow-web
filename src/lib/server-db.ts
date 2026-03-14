import Database from "better-sqlite3";

let _db: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;

  const dbPath = process.env.DB_PATH;
  if (!dbPath) {
    throw new Error("DB_PATH is not set");
  }

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("busy_timeout = 30000");
  return _db;
}