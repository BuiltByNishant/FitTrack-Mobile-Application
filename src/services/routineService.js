// Rules for the custom workout builder. Plain functions: no storage, no UI.
import { validateName, validateReps } from '../utils/validation';

export const MAX_SETS = 20;
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 10;

// Planned sets: a positive whole number.
export function validatePlannedSets(text) {
  const t = String(text ?? '').trim();
  if (!t) return { ok: false, error: 'Enter the number of sets.' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'Sets must be a whole number, like 3.' };
  const n = parseInt(t, 10);
  if (n <= 0) return { ok: false, error: 'Sets must be greater than zero.' };
  if (n > MAX_SETS) return { ok: false, error: `Sets must be ${MAX_SETS} or fewer.` };
  return { ok: true, value: n };
}

// Target reps: a positive whole number (same rule as logging a set).
export function validatePlannedReps(text) {
  const check = validateReps(text);
  if (check.ok) return check;
  return { ok: false, error: check.error.replace('Repetitions', 'Target reps').replace('Enter the number of repetitions.', 'Enter the target reps.') };
}

// Checks the whole form. items: [{ exerciseId, setsText, repsText }].
// Returns { ok, nameError, listError, itemErrors: { [exerciseId]: { sets, reps } }, value }.
// value has the trimmed name and numeric targets, ready to save.
export function validateRoutine({ name, items }) {
  const nameCheck = validateName(name, 'Workout name');
  const listError = items.length === 0 ? 'Add at least one exercise to your workout.' : null;
  const seen = new Set();
  const itemErrors = {};
  const cleanItems = [];
  for (const item of items) {
    const sets = validatePlannedSets(item.setsText);
    const reps = validatePlannedReps(item.repsText);
    const errs = {};
    if (!sets.ok) errs.sets = sets.error;
    if (!reps.ok) errs.reps = reps.error;
    if (seen.has(item.exerciseId)) errs.duplicate = 'This exercise is in the workout twice. Remove one.';
    seen.add(item.exerciseId);
    if (Object.keys(errs).length) itemErrors[item.exerciseId] = errs;
    else cleanItems.push({ exerciseId: item.exerciseId, targetSets: sets.value, targetReps: reps.value });
  }
  const ok = nameCheck.ok && !listError && Object.keys(itemErrors).length === 0;
  return {
    ok,
    nameError: nameCheck.ok ? null : nameCheck.error,
    listError,
    itemErrors,
    value: ok ? { name: nameCheck.value, items: cleanItems } : null,
  };
}

// A new array with the item at `index` moved up (-1) or down (+1). Out-of-range moves change nothing.
export function moveItem(list, index, direction) {
  const to = index + direction;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function summarizePlan(items) {
  const exercises = items.length;
  const sets = items.reduce((n, i) => n + (i.targetSets ?? 0), 0);
  return `${exercises} exercise${exercises === 1 ? '' : 's'} · ${sets} set${sets === 1 ? '' : 's'}`;
}
