import { getDb } from '../db/database';

export async function getPref(key, fallback = '') {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT value FROM app_preferences WHERE key = ?', [key]);
  return row ? row.value : fallback;
}

export async function setPref(key, value) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value)]
  );
}

export async function getWeightUnit() {
  return (await getPref('weightUnit', 'kg')) === 'lb' ? 'lb' : 'kg';
}

export async function setWeightUnit(unit) {
  await setPref('weightUnit', unit === 'lb' ? 'lb' : 'kg');
}
