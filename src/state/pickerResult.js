// Hands the exercises chosen in the picker back to the workout builder.
// The builder keeps its unsaved form in memory while the picker is open; this holds the chosen ids for one return trip.
let pending = null;

export function setPickerResult(ids) {
  pending = ids;
}

export function takePickerResult() {
  const ids = pending;
  pending = null;
  return ids;
}
