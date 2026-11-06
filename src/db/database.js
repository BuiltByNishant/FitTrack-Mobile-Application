import * as SQLite from 'expo-sqlite';
import { STARTER_EXERCISES } from './seed';

const DB_NAME = 'fittrack.db';
const SCHEMA_VERSION = 1;

let dbPromise = null;

// One shared connection for the whole app. The first call opens the file, creates tables and seeds data.
export function getDb() {
  if (!dbPromise) {
    dbPromise = initDb().catch((error) => {
      dbPromise = null; // allow a retry
      throw error;
    });
  }
  return dbPromise;
}

async function initDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db) {
  const row = await db.getFirstAsync('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        muscle_group TEXT NOT NULL,
        equipment TEXT NOT NULL DEFAULT 'Other',
        is_custom INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );
      CREATE TABLE IF NOT EXISTS set_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        set_number INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sets_session ON set_entries(session_id);
      CREATE INDEX IF NOT EXISTS idx_sets_exercise ON set_entries(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_ended ON workout_sessions(ended_at);
    `);

    for (const [name, group, equipment] of STARTER_EXERCISES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, equipment, is_custom) VALUES (?, ?, ?, 0)',
        [name, group, equipment]
      );
    }
    const defaults = [
      ['weightUnit', 'kg'],
      ['reminderEnabled', '0'],
      ['reminderTime', '18:00'],
      ['reminderNotificationId', ''],
    ];
    for (const [key, value] of defaults) {
      await db.runAsync('INSERT OR IGNORE INTO app_preferences (key, value) VALUES (?, ?)', [key, value]);
    }
  });
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
