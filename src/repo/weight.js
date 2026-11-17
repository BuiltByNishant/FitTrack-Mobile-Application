import { getDb } from '../db/database';

function mapEntry(r) {
  return { id: r.id, measuredAt: r.measured_at, weightKg: r.weight_kg, note: r.note ?? '' };
}

// Newest first. The newest entry is the current weight.
export async function listWeightEntries() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM weight_entries ORDER BY measured_at DESC, id DESC');
  return rows.map(mapEntry);
}

export async function getWeightEntry(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM weight_entries WHERE id = ?', [id]);
  return row ? mapEntry(row) : null;
}

export async function addWeightEntry({ measuredAt, weightKg, note }) {
  const db = await getDb();
  const res = await db.runAsync('INSERT INTO weight_entries (measured_at, weight_kg, note) VALUES (?, ?, ?)', [
    measuredAt,
    weightKg,
    note ? note : null,
  ]);
  return res.lastInsertRowId;
}

export async function updateWeightEntry(id, { measuredAt, weightKg, note }) {
  const db = await getDb();
  await db.runAsync('UPDATE weight_entries SET measured_at = ?, weight_kg = ?, note = ? WHERE id = ?', [
    measuredAt,
    weightKg,
    note ? note : null,
    id,
  ]);
}

export async function deleteWeightEntry(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
}

export async function clearWeightEntries() {
  const db = await getDb();
  await db.runAsync('DELETE FROM weight_entries');
}

// Used when the profile's "current weight" is saved: updates today's check-in, or adds one.
export async function saveTodayWeight(weightKg, todayIso) {
  const db = await getDb();
  const start = new Date(todayIso);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const existing = await db.getFirstAsync(
    'SELECT id FROM weight_entries WHERE measured_at >= ? AND measured_at < ? ORDER BY measured_at DESC, id DESC LIMIT 1',
    [start.toISOString(), end.toISOString()]
  );
  if (existing) {
    await db.runAsync('UPDATE weight_entries SET weight_kg = ? WHERE id = ?', [weightKg, existing.id]);
  } else {
    await db.runAsync('INSERT INTO weight_entries (measured_at, weight_kg) VALUES (?, ?)', [todayIso, weightKg]);
  }
}
