// Workout rules and progress calculations: plain functions with no storage or UI.
import { addDays, startOfWeek } from '../utils/dates';

export function computeSessionTotals(detail) {
  let totalSets = 0;
  let completedSets = 0;
  let volumeKg = 0;
  for (const ex of detail.exercises) {
    for (const s of ex.sets) {
      totalSets += 1;
      if (s.completed) {
        completedSets += 1;
        volumeKg += s.weightKg * s.reps; // simple logging metric, completed sets only
      }
    }
  }
  const end = detail.endedAt ? new Date(detail.endedAt).getTime() : Date.now();
  return {
    exerciseCount: detail.exercises.length,
    totalSets,
    completedSets,
    volumeKg,
    durationMs: Math.max(0, end - new Date(detail.startedAt).getTime()),
  };
}

// A saved workout needs at least one completed set.
export function checkCanFinish(detail) {
  const { completedSets } = computeSessionTotals(detail);
  if (completedSets === 0) {
    return 'Mark at least one set as done before finishing. Tap the check button on a set after you complete it.';
  }
  return null;
}

// Completed sessions started during the current week (Monday to Sunday, device time).
export function countSessionsThisWeek(sessions, now = new Date()) {
  const from = startOfWeek(now).getTime();
  const to = addDays(startOfWeek(now), 7).getTime();
  return sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= from && t < to;
  }).length;
}

// Best set rule: highest weight among completed weighted sets. Ties go to more reps, then the most recent.
export function isBetterSet(candidate, current) {
  if (Math.abs(candidate.weightKg - current.weightKg) > 1e-9) return candidate.weightKg > current.weightKg;
  if (candidate.reps !== current.reps) return candidate.reps > current.reps;
  return candidate.startedAt > current.startedAt;
}

export function bestCompletedSet(rows) {
  let best = null;
  for (const r of rows) {
    if (!r.completed || !(r.weightKg > 0)) continue;
    if (!best || isBetterSet(r, best)) best = r;
  }
  return best;
}
