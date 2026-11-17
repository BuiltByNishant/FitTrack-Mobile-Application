// Weights are ALWAYS stored in kilograms. These helpers convert for display and input only.
export const KG_PER_LB = 0.45359237;
export const UNITS = ['kg', 'lb'];

export function kgToDisplay(kg, unit) {
  const value = unit === 'lb' ? kg / KG_PER_LB : kg;
  return Math.round(value * 100) / 100;
}

export function displayToKg(value, unit) {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

// Rounds to 2 decimals and drops trailing zeros: 60 -> "60", 61.5 -> "61.5"
export function formatNumber(n) {
  return String(Math.round(n * 100) / 100);
}

export function formatWeight(kg, unit) {
  return `${formatNumber(kgToDisplay(kg, unit))} ${unit}`;
}

// Text shown inside a weight input box (no unit suffix).
export function weightInputText(kg, unit) {
  return formatNumber(kgToDisplay(kg, unit));
}

// ---------- Height (stored in centimetres) ----------
export const HEIGHT_UNITS = ['cm', 'ftin'];
const CM_PER_INCH = 2.54;

// 175.26 cm -> { ft: 5, inches: 9 }. Inches are rounded to the nearest whole inch.
export function cmToFeetInches(cm) {
  let totalInches = Math.round(cm / CM_PER_INCH);
  const ft = Math.floor(totalInches / 12);
  return { ft, inches: totalInches - ft * 12 };
}

export function feetInchesToCm(ft, inches) {
  return (ft * 12 + inches) * CM_PER_INCH;
}

export function formatHeight(cm, unit) {
  if (unit === 'ftin') {
    const { ft, inches } = cmToFeetInches(cm);
    return `${ft} ft ${inches} in`;
  }
  return `${formatNumber(cm)} cm`;
}
