export const workoutPresets = {
  'chest-biceps': { label: 'Chest + Biceps', pair: ['Dumbbell chest press', 'Dumbbell biceps curl'] },
  'back-triceps': { label: 'Back + Triceps', pair: ['Lat pulldown', 'Cable triceps pushdown'] },
  legs: { label: 'Legs', pair: ['Goblet squat', 'Dumbbell Romanian deadlift'] },
  chest: { label: 'Chest', pair: ['Dumbbell chest press', 'Push-up'] },
  biceps: { label: 'Biceps', pair: ['Dumbbell biceps curl', 'Hammer curl'] },
  back: { label: 'Back', pair: ['Lat pulldown', 'Single-arm dumbbell row'] },
  triceps: { label: 'Triceps', pair: ['Cable triceps pushdown', 'Overhead dumbbell triceps extension'] },
  shoulders: { label: 'Shoulders', pair: ['Dumbbell shoulder press', 'Dumbbell lateral raise'] },
  core: { label: 'Core', pair: ['Dead bug', 'Forearm plank'] },
  'full-body': { label: 'Full body', pair: ['Goblet squat', 'Dumbbell chest press'] },
};

export const exerciseNameLimit = 80;

export function lastWorkoutPair(entries, focus, date) {
  let last;
  for (const entry of entries) {
    if (entry.type === 'gym' && entry.workoutFocus === focus && entry.exercises?.length === 2
        && entry.date < date && (!last || entry.date > last.date)) {
      last = entry;
    }
  }
  return last?.exercises;
}
