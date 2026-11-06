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
