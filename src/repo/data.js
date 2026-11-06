import { getDb } from '../db/database';

export async function deleteAllHistory() {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_sessions');
}

// Removes workouts and custom exercises. Unit and reminder settings are kept.
export async function resetAllData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workout_sessions');
    await db.runAsync('DELETE FROM exercises WHERE is_custom = 1');
  });
}

export async function getDataCounts() {
  const db = await getDb();
  const sessions = await db.getFirstAsync('SELECT COUNT(*) AS n FROM workout_sessions WHERE ended_at IS NOT NULL');
  const custom = await db.getFirstAsync('SELECT COUNT(*) AS n FROM exercises WHERE is_custom = 1');
  return { sessions: sessions?.n ?? 0, customExercises: custom?.n ?? 0 };
}
