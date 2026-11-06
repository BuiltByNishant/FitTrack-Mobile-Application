// The three ready-to-use workouts. Starting one creates a session with these exercises,
// each with three starter sets (repetitions below, weight copied from the last completed set or 0).
export const SETS_PER_EXERCISE = 3;

export const TEMPLATES = [
  {
    id: 'full-body-a',
    name: 'Full Body A',
    description: 'Squat, press, pull and hinge in one session.',
    exercises: [
      { name: 'Back Squat', reps: 8 },
      { name: 'Barbell Bench Press', reps: 8 },
      { name: 'Barbell Row', reps: 8 },
      { name: 'Overhead Press', reps: 8 },
      { name: 'Romanian Deadlift', reps: 10 },
    ],
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    description: 'Chest, back, shoulders and arms.',
    exercises: [
      { name: 'Barbell Bench Press', reps: 8 },
      { name: 'Barbell Row', reps: 8 },
      { name: 'Overhead Press', reps: 8 },
      { name: 'Lat Pulldown', reps: 10 },
      { name: 'Dumbbell Curl', reps: 12 },
      { name: 'Triceps Pushdown', reps: 12 },
    ],
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    description: 'Quads, hamstrings, glutes and calves.',
    exercises: [
      { name: 'Back Squat', reps: 8 },
      { name: 'Romanian Deadlift', reps: 10 },
      { name: 'Leg Press', reps: 10 },
      { name: 'Leg Curl', reps: 12 },
      { name: 'Hip Thrust', reps: 10 },
      { name: 'Standing Calf Raise', reps: 15 },
    ],
  },
];
