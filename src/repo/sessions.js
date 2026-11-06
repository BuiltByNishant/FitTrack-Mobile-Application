import { getDb } from '../db/database';
import { SETS_PER_EXERCISE } from '../data/templates';

const DEFAULT_REPS = 10;

export async function getActiveSession() {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT id, title, started_at AS startedAt FROM workout_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  );
  return row ?? null;
}

// Weight from the most recent completed set of this exercise, so new sets start from what you last lifted.
async function lastCompletedWeightKg(db, exerciseId) {
  const row = await db.getFirstAsync(
    `SELECT se.weight_kg AS weightKg
     FROM set_entries se
     JOIN workout_sessions s ON s.id = se.session_id
     WHERE se.exercise_id = ? AND se.completed = 1 AND s.ended_at IS NOT NULL
     ORDER BY s.started_at DESC, se.set_number DESC
     LIMIT 1`,
    [exerciseId]
  );
  return row?.weightKg ?? 0;
}

async function insertStarterSets(db, sessionId, exerciseId, reps) {
  const weightKg = await lastCompletedWeightKg(db, exerciseId);
  for (let n = 1; n <= SETS_PER_EXERCISE; n++) {
    await db.runAsync(
      'INSERT INTO set_entries (session_id, exercise_id, set_number, reps, weight_kg, completed) VALUES (?, ?, ?, ?, ?, 0)',
      [sessionId, exerciseId, n, reps, weightKg]
    );
  }
}

// Creates and saves the session immediately, so it survives leaving the screen or closing the app.
export async function startSessionFromTemplate(template) {
  const db = await getDb();
  const now = new Date().toISOString();
  let sessionId;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync('INSERT INTO workout_sessions (title, started_at) VALUES (?, ?)', [
      template.name,
      now,
    ]);
    sessionId = res.lastInsertRowId;
    for (const item of template.exercises) {
      const ex = await db.getFirstAsync('SELECT id FROM exercises WHERE name = ?', [item.name]);
      if (ex) await insertStarterSets(db, sessionId, ex.id, item.reps);
    }
  });
  return sessionId;
}

export async function addExerciseToSession(sessionId, exerciseId) {
  const db = await getDb();
  const existing = await db.getFirstAsync(
    'SELECT id FROM set_entries WHERE session_id = ? AND exercise_id = ? LIMIT 1',
    [sessionId, exerciseId]
  );
  if (existing) throw new Error('That exercise is already in this workout.');
  await db.withTransactionAsync(async () => {
    await insertStarterSets(db, sessionId, exerciseId, DEFAULT_REPS);
  });
}

export async function getSessionDetail(id) {
  const db = await getDb();
  const s = await db.getFirstAsync('SELECT * FROM workout_sessions WHERE id = ?', [id]);
  if (!s) return null;
  const rows = await db.getAllAsync(
    `SELECT se.id, se.exercise_id AS exerciseId, se.set_number AS setNumber, se.reps,
            se.weight_kg AS weightKg, se.completed, e.name, e.muscle_group AS muscleGroup, e.equipment
     FROM set_entries se
     JOIN exercises e ON e.id = se.exercise_id
     WHERE se.session_id = ?
     ORDER BY se.id`,
    [id]
  );
  const exercises = [];
  const byExercise = new Map();
  for (const r of rows) {
    let ex = byExercise.get(r.exerciseId);
    if (!ex) {
      ex = {
        exerciseId: r.exerciseId,
        name: r.name,
        muscleGroup: r.muscleGroup,
        equipment: r.equipment,
        isBodyweight: r.equipment === 'Bodyweight',
        sets: [],
      };
      byExercise.set(r.exerciseId, ex);
      exercises.push(ex);
    }
    ex.sets.push({
      id: r.id,
      setNumber: r.setNumber,
      reps: r.reps,
      weightKg: r.weightKg,
      completed: !!r.completed,
    });
  }
  return { id: s.id, title: s.title, startedAt: s.started_at, endedAt: s.ended_at, exercises };
}

export async function updateSetValues(setId, { reps, weightKg }) {
  const db = await getDb();
  await db.runAsync('UPDATE set_entries SET reps = ?, weight_kg = ? WHERE id = ?', [reps, weightKg, setId]);
}

export async function setSetCompleted(setId, completed) {
  const db = await getDb();
  await db.runAsync('UPDATE set_entries SET completed = ? WHERE id = ?', [completed ? 1 : 0, setId]);
}

export async function finishSession(sessionId) {
  const db = await getDb();
  await db.runAsync('UPDATE workout_sessions SET ended_at = ? WHERE id = ?', [new Date().toISOString(), sessionId]);
}

// Used to discard an unfinished workout.
export async function deleteSession(sessionId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
}

// Completed sessions with totals. Volume counts completed sets only.
export async function listCompletedSessions() {
  const db = await getDb();
  return db.getAllAsync(`
    SELECT s.id, s.title, s.started_at AS startedAt, s.ended_at AS endedAt,
      (SELECT COUNT(DISTINCT se.exercise_id) FROM set_entries se WHERE se.session_id = s.id) AS exerciseCount,
      (SELECT COUNT(*) FROM set_entries se WHERE se.session_id = s.id) AS setCount,
      (SELECT COUNT(*) FROM set_entries se WHERE se.session_id = s.id AND se.completed = 1) AS completedSetCount,
      (SELECT COALESCE(SUM(se.weight_kg * se.reps), 0) FROM set_entries se
         WHERE se.session_id = s.id AND se.completed = 1) AS volumeKg
    FROM workout_sessions s
    WHERE s.ended_at IS NOT NULL
    ORDER BY s.started_at DESC
  `);
}

// Completed weighted sets from completed sessions, used for the best-set summary.
export async function listCompletedWeightedSets() {
  const db = await getDb();
  return db.getAllAsync(`
    SELECT se.exercise_id AS exerciseId, e.name, se.weight_kg AS weightKg, se.reps,
           se.completed, s.started_at AS startedAt
    FROM set_entries se
    JOIN workout_sessions s ON s.id = se.session_id
    JOIN exercises e ON e.id = se.exercise_id
    WHERE s.ended_at IS NOT NULL AND se.completed = 1 AND se.weight_kg > 0
  `);
}
