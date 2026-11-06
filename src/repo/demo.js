import { getDb } from '../db/database';
import { SETS_PER_EXERCISE, TEMPLATES } from '../data/templates';

// Days ago for each demo workout, newest first. Rotation: Full Body A, Upper, Lower.
const DAYS_AGO = [0, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25];

const BASE_KG = {
  'Back Squat': 70, 'Barbell Bench Press': 55, 'Barbell Row': 50, 'Overhead Press': 32.5,
  'Romanian Deadlift': 70, 'Lat Pulldown': 45, 'Dumbbell Curl': 12, 'Triceps Pushdown': 25,
  'Leg Press': 120, 'Leg Curl': 35, 'Hip Thrust': 80, 'Standing Calf Raise': 60,
};

// Adds about four weeks of completed example workouts so Home and History have data to show.
export async function loadDemoData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const exRows = await db.getAllAsync('SELECT id, name FROM exercises');
    const exId = {};
    exRows.forEach((r) => {
      exId[r.name] = r.id;
    });

    const ordered = [...DAYS_AGO].reverse(); // oldest first so weights can climb
    for (let i = 0; i < ordered.length; i++) {
      const daysAgo = ordered[i];
      const template = TEMPLATES[i % TEMPLATES.length];
      const cycle = Math.floor(i / TEMPLATES.length);

      const start = new Date();
      if (daysAgo === 0) start.setHours(start.getHours() - 3);
      else {
        start.setDate(start.getDate() - daysAgo);
        start.setHours(18, 0, 0, 0);
      }
      const end = new Date(start.getTime() + (50 + (i % 3) * 5) * 60000);

      const res = await db.runAsync('INSERT INTO workout_sessions (title, started_at, ended_at) VALUES (?, ?, ?)', [
        template.name,
        start.toISOString(),
        end.toISOString(),
      ]);
      for (const item of template.exercises) {
        if (!exId[item.name]) continue;
        const weight = (BASE_KG[item.name] ?? 20) + cycle * 2.5;
        for (let n = 1; n <= SETS_PER_EXERCISE; n++) {
          await db.runAsync(
            'INSERT INTO set_entries (session_id, exercise_id, set_number, reps, weight_kg, completed) VALUES (?, ?, ?, ?, ?, 1)',
            [res.lastInsertRowId, exId[item.name], n, n === SETS_PER_EXERCISE ? item.reps - 1 : item.reps, weight]
          );
        }
      }
    }
  });
}
