import { getDb } from '../db/database';

function mapProfile(r) {
  return {
    displayName: r.display_name ?? '',
    heightCm: r.height_cm ?? null,
    targetWeightKg: r.target_weight_kg ?? null,
    weightUnit: r.weight_unit === 'lb' ? 'lb' : 'kg',
    heightUnit: r.height_unit === 'ftin' ? 'ftin' : 'cm',
    weeklyGoal: r.weekly_workout_goal ?? 3,
  };
}

export async function getProfile() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');
  if (row) return mapProfile(row);
  await db.runAsync('INSERT OR IGNORE INTO user_profile (id) VALUES (1)');
  return mapProfile(await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1'));
}

// Saves the editable profile fields. Height and target weight are optional (null clears them).
export async function saveProfile({ displayName, heightCm, targetWeightKg }) {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET display_name = ?, height_cm = ?, target_weight_kg = ? WHERE id = 1', [
    displayName ? displayName : null,
    heightCm,
    targetWeightKg,
  ]);
}

export async function getWeightUnit() {
  return (await getProfile()).weightUnit;
}

export async function setWeightUnit(unit) {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET weight_unit = ? WHERE id = 1', [unit === 'lb' ? 'lb' : 'kg']);
}

export async function getHeightUnit() {
  return (await getProfile()).heightUnit;
}

export async function setHeightUnit(unit) {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET height_unit = ? WHERE id = 1', [unit === 'ftin' ? 'ftin' : 'cm']);
}

export async function setWeeklyGoal(goal) {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET weekly_workout_goal = ? WHERE id = 1', [goal]);
}

// Clears name, height, target weight and the weekly goal. Units are kept.
export async function clearProfile() {
  const db = await getDb();
  await db.runAsync(
    'UPDATE user_profile SET display_name = NULL, height_cm = NULL, target_weight_kg = NULL, weekly_workout_goal = 3 WHERE id = 1'
  );
}
