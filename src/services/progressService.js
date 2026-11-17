// Profile and goal calculations (FitTrack 1.1). Plain functions: no storage, no UI.

export function greeting(now = new Date(), name = '') {
  const h = now.getHours();
  const base = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const n = String(name ?? '').trim();
  return n ? `${base}, ${n}` : base;
}

// entries are newest first. The newest entry is the current weight.
export function currentWeight(entries) {
  return entries.length ? entries[0] : null;
}

// Change from the first saved entry to the newest one, in kg (negative = lighter).
export function weightChangeKg(entries) {
  if (entries.length < 2) return null;
  return entries[0].weightKg - entries[entries.length - 1].weightKg;
}

// Progress from the first saved weight toward the target, working for losing or gaining weight.
// Returns null when there is no target or no weight yet.
export function goalProgress({ startKg, currentKg, targetKg }) {
  if (targetKg == null || currentKg == null) return null;
  const diff = currentKg - targetKg;
  const direction = diff > 0 ? 'down' : 'up';
  const close = Math.abs(diff) < 0.05;
  let fraction;
  if (startKg == null || Math.abs(startKg - targetKg) < 0.05) {
    fraction = close ? 1 : 0;
  } else {
    fraction = Math.min(1, Math.max(0, (startKg - currentKg) / (startKg - targetKg)));
  }
  const passed = startKg != null && ((startKg > targetKg && currentKg <= targetKg) || (startKg < targetKg && currentKg >= targetKg));
  const reached = close || passed;
  return { remainingKg: reached ? 0 : Math.abs(diff), direction, reached, fraction: reached ? 1 : fraction };
}

export function weeklyGoalProgress(count, goal) {
  const safeGoal = goal > 0 ? goal : 1;
  return { count, goal: safeGoal, fraction: Math.min(1, count / safeGoal), met: count >= safeGoal };
}

// The last `max` entries, oldest first, for the trend bars.
export function trendPoints(entries, max = 8) {
  return entries.slice(0, max).reverse();
}

// Local noon of a calendar day, so a check-in keeps its date in any time zone.
export function noonOf(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}
