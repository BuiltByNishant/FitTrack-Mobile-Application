import { getDb } from '../db/database';

function mapExercise(r) {
  return {
    id: r.id,
    name: r.name,
    muscleGroup: r.muscle_group,
    equipment: r.equipment,
    isCustom: !!r.is_custom,
    isBodyweight: r.equipment === 'Bodyweight',
  };
}

export async function listExercises() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM exercises ORDER BY muscle_group, name');
  return rows.map(mapExercise);
}

// Saves a custom exercise to the library and returns its id.
export async function createExercise({ name, muscleGroup, equipment }) {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT id FROM exercises WHERE name = ?', [name]);
  if (existing) throw new Error('An exercise with that name already exists.');
  const res = await db.runAsync(
    'INSERT INTO exercises (name, muscle_group, equipment, is_custom) VALUES (?, ?, ?, 1)',
    [name, muscleGroup, equipment]
  );
  return res.lastInsertRowId;
}
