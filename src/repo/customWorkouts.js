import { getDb } from '../db/database';

export async function listCustomWorkouts() {
  const db = await getDb();
  const workouts = await db.getAllAsync(`
    SELECT w.id, w.name, w.updated_at AS updatedAt,
           COUNT(i.id) AS exerciseCount, COALESCE(SUM(i.target_sets), 0) AS setCount
    FROM custom_workouts w
    LEFT JOIN custom_workout_items i ON i.workout_id = w.id
    GROUP BY w.id
    ORDER BY w.updated_at DESC, w.id DESC
  `);
  const names = await db.getAllAsync(`
    SELECT i.workout_id AS workoutId, e.name
    FROM custom_workout_items i JOIN exercises e ON e.id = i.exercise_id
    ORDER BY i.workout_id, i.position
  `);
  return workouts.map((w) => ({ ...w, exerciseNames: names.filter((n) => n.workoutId === w.id).map((n) => n.name) }));
}

export async function getCustomWorkout(id) {
  const db = await getDb();
  const w = await db.getFirstAsync('SELECT * FROM custom_workouts WHERE id = ?', [id]);
  if (!w) return null;
  const rows = await db.getAllAsync(
    `SELECT i.exercise_id AS exerciseId, i.target_sets AS targetSets, i.target_reps AS targetReps,
            e.name, e.muscle_group AS muscleGroup, e.equipment
     FROM custom_workout_items i
     JOIN exercises e ON e.id = i.exercise_id
     WHERE i.workout_id = ?
     ORDER BY i.position`,
    [id]
  );
  return {
    id: w.id,
    name: w.name,
    items: rows.map((r) => ({ ...r, isBodyweight: r.equipment === 'Bodyweight' })),
  };
}

// Creates a routine (no id) or replaces an existing one (id). items keep their order.
export async function saveCustomWorkout({ id, name, items }) {
  const db = await getDb();
  const now = new Date().toISOString();
  let workoutId = id;
  await db.withTransactionAsync(async () => {
    if (workoutId) {
      await db.runAsync('UPDATE custom_workouts SET name = ?, updated_at = ? WHERE id = ?', [name, now, workoutId]);
      await db.runAsync('DELETE FROM custom_workout_items WHERE workout_id = ?', [workoutId]);
    } else {
      const res = await db.runAsync('INSERT INTO custom_workouts (name, created_at, updated_at) VALUES (?, ?, ?)', [name, now, now]);
      workoutId = res.lastInsertRowId;
    }
    for (let i = 0; i < items.length; i++) {
      await db.runAsync(
        'INSERT INTO custom_workout_items (workout_id, exercise_id, position, target_sets, target_reps) VALUES (?, ?, ?, ?, ?)',
        [workoutId, items[i].exerciseId, i, items[i].targetSets, items[i].targetReps]
      );
    }
  });
  return workoutId;
}

export async function duplicateCustomWorkout(id) {
  const w = await getCustomWorkout(id);
  if (!w) throw new Error('That workout no longer exists.');
  return saveCustomWorkout({
    name: `${w.name} (copy)`.slice(0, 60),
    items: w.items.map((i) => ({ exerciseId: i.exerciseId, targetSets: i.targetSets, targetReps: i.targetReps })),
  });
}

// Removes the routine and its item rows. Past sessions and the exercise library are untouched.
export async function deleteCustomWorkout(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM custom_workouts WHERE id = ?', [id]);
}
