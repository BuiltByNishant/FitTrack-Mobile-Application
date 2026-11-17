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

// ---------- Body measurements (FitTrack 1.1) ----------
// Positive numbers only. The upper limits just catch typing slips such as an extra zero.

export function validateBodyWeight(text, { required = true } = {}) {
  const t = String(text ?? '').trim().replace(',', '.');
  if (!t) return required ? { ok: false, error: 'Enter a weight.' } : { ok: true, value: null };
  if (t.startsWith('-')) return { ok: false, error: 'Weight must be a positive number.' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return { ok: false, error: 'Weight must be a number, like 72.5.' };
  const n = Number(t);
  if (!(n > 0)) return { ok: false, error: 'Weight must be greater than zero.' };
  if (n > 700) return { ok: false, error: 'That weight looks too high. Check the number.' };
  return { ok: true, value: n };
}

export function validateHeightCm(text, { required = false } = {}) {
  const t = String(text ?? '').trim().replace(',', '.');
  if (!t) return required ? { ok: false, error: 'Enter a height.' } : { ok: true, value: null };
  if (t.startsWith('-')) return { ok: false, error: 'Height must be a positive number.' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return { ok: false, error: 'Height must be a number, like 175.' };
  const n = Number(t);
  if (!(n > 0)) return { ok: false, error: 'Height must be greater than zero.' };
  if (n < 50 || n > 300) return { ok: false, error: 'Height should be between 50 and 300 cm.' };
  return { ok: true, value: n };
}

// Feet and inches boxes. Both blank means "no height". Returns centimetres.
export function validateFeetInches(ftText, inText) {
  const ft = String(ftText ?? '').trim();
  const inch = String(inText ?? '').trim();
  if (!ft && !inch) return { ok: true, value: null };
  if (!/^\d+$/.test(ft)) return { ok: false, error: 'Feet must be a whole number, like 5.' };
  if (inch && !/^(\d+\.?\d*|\.\d+)$/.test(inch.replace(',', '.'))) {
    return { ok: false, error: 'Inches must be a number from 0 to 11, like 9.' };
  }
  const feet = parseInt(ft, 10);
  const inches = inch ? Number(inch.replace(',', '.')) : 0;
  if (inches >= 12) return { ok: false, error: 'Inches must be less than 12. Add a foot instead.' };
  const cm = (feet * 12 + inches) * 2.54;
  if (!(cm > 0)) return { ok: false, error: 'Height must be greater than zero.' };
  if (cm < 50 || cm > 300) return { ok: false, error: 'Height should be between 1 ft 8 in and 9 ft 10 in.' };
  return { ok: true, value: cm };
}

export function validateWeeklyGoal(n) {
  return Number.isInteger(n) && n >= 1 && n <= 7;
}
