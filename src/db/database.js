import * as SQLite from 'expo-sqlite';
import { STARTER_EXERCISES } from './seed';

const DB_NAME = 'fittrack.db';
const SCHEMA_VERSION = 3;

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
  if (current < 1) await migrateToV1(db);
  if (current < 2) await migrateToV2(db);
  if (current < 3) await migrateToV3(db);
}

// Version 1: workouts, exercises and preferences.
async function migrateToV1(db) {
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
  await db.execAsync('PRAGMA user_version = 1');
}

// Version 2 (FitTrack 1.1): one local profile row and dated weight check-ins.
// The existing weight unit preference is copied into the profile so nothing is lost on upgrade.
async function migrateToV2(db) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        display_name TEXT,
        height_cm REAL,
        target_weight_kg REAL,
        weight_unit TEXT NOT NULL DEFAULT 'kg',
        height_unit TEXT NOT NULL DEFAULT 'cm',
        weekly_workout_goal INTEGER NOT NULL DEFAULT 3
      );
      CREATE TABLE IF NOT EXISTS weight_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        measured_at TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_weight_measured ON weight_entries(measured_at);
    `);
    await db.runAsync(
      `INSERT OR IGNORE INTO user_profile (id, weight_unit)
       VALUES (1, CASE WHEN (SELECT value FROM app_preferences WHERE key = 'weightUnit') = 'lb' THEN 'lb' ELSE 'kg' END)`
    );
  });
  await db.execAsync('PRAGMA user_version = 2');
}

// Version 3 (FitTrack 1.2): saved custom workouts. A routine stores a PLAN only; starting one copies the plan into
// normal session and set rows, so editing or deleting a routine never changes past sessions.
// Deleting a routine removes its item rows (ON DELETE CASCADE) but never touches the exercise library.
async function migrateToV3(db) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS custom_workout_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES custom_workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        target_sets INTEGER NOT NULL,
        target_reps INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_custom_items_order ON custom_workout_items(workout_id, position);
    `);
  });
  await db.execAsync('PRAGMA user_version = 3');
}
