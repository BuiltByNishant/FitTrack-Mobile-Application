// Input validation rules from the project documentation.
// Every function returns { ok: true, value } or { ok: false, error }.

export function validateName(text, label = 'Name') {
  const value = String(text ?? '').trim();
  if (!value) return { ok: false, error: `${label} cannot be blank.` };
  if (value.length > 60) return { ok: false, error: `${label} must be 60 characters or fewer.` };
  return { ok: true, value };
}

// Repetitions must be a positive whole number.
export function validateReps(text) {
  const t = String(text ?? '').trim();
  if (!t) return { ok: false, error: 'Enter the number of repetitions.' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'Repetitions must be a whole number, like 8.' };
  const n = parseInt(t, 10);
  if (n <= 0) return { ok: false, error: 'Repetitions must be greater than zero.' };
  if (n > 1000) return { ok: false, error: 'Repetitions must be 1000 or fewer.' };
  return { ok: true, value: n };
}

// Weight cannot be negative; zero is allowed for bodyweight-only sets.
export function validateWeight(text) {
  const t = String(text ?? '').trim().replace(',', '.');
  if (!t) return { ok: false, error: 'Enter a weight (use 0 for bodyweight).' };
  if (t.startsWith('-')) return { ok: false, error: 'Weight cannot be negative.' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return { ok: false, error: 'Weight must be a number, like 42.5.' };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, error: 'Weight must be a number, like 42.5.' };
  if (n > 5000) return { ok: false, error: 'Weight looks too high. Check the number.' };
  return { ok: true, value: n };
}
