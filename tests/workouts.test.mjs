import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreRemoved, validate } from '../dist/core.js';
import { snapshot } from '../dist/wallpaper.js';
import { lastWorkoutPair } from '../dist/workouts.js';

const entry = (date, type = 'gym', details = {}) => ({
  id: date + type, date, type, duration: null, distance: null, note: '',
  createdAt: '2026-11-01T12:00:00Z', updatedAt: '2026-11-01T12:00:00Z', ...details,
});

test('gym focus and exercises survive import and undo while the wallpaper uses dates', () => {
  const gym = entry('2026-11-06', 'gym', {
    workoutFocus: 'chest-biceps', exercises: ['Dumbbell chest press', 'Hammer curl'],
  });
  const backup = JSON.parse(JSON.stringify({ version: 1, entries: [gym] }));
  assert.deepEqual(validate(backup, '2026-11-06'), [gym]);
  assert.deepEqual(restoreRemoved([], backup.entries, '2026-11-06').entries, [gym]);
  assert.deepEqual(snapshot([gym], 'Asia/Kolkata').days, [['2026-11-06', 'train']]);
});

test('workout details accept one custom exercise and reject invalid focus or exercise data', () => {
  const date = '2026-11-06';
  const check = row => validate({ version: 1, entries: [row] }, date);
  assert.deepEqual(check(entry(date, 'gym', { exercises: ['  Step-up  '] }))[0].exercises, ['Step-up']);
  for (const row of [
    entry(date, 'gym', { workoutFocus: 'constructor' }),
    entry(date, 'run', { workoutFocus: 'legs' }),
    entry(date, 'rest', { exercises: ['Step-up'] }),
    entry(date, 'gym', { exercises: ['Squat', 'Lunge', 'Step-up'] }),
    entry(date, 'gym', { exercises: ['   '] }),
  ]) {
    assert.throws(() => check(row));
  }
});

test('suggestions reuse the most recent complete pair for that focus before the selected day', () => {
  const gym = (date, workoutFocus, exercises) => entry(date, 'gym', { workoutFocus, exercises });
  const pair = ['Push-up', 'Hammer curl'];
  const rows = [
    gym('2026-11-08', 'chest-biceps', ['Chest fly', 'Biceps curl']),
    gym('2026-11-05', 'chest-biceps', pair),
    gym('2026-11-07', 'chest-biceps', ['Chest press']),
    gym('2026-11-01', 'chest-biceps', ['Bench press', 'Preacher curl']),
    gym('2026-11-06', 'legs', ['Goblet squat', 'Leg curl']),
  ];
  assert.deepEqual(lastWorkoutPair(rows, 'chest-biceps', '2026-11-08'), pair);
  assert.equal(lastWorkoutPair(rows, 'back-triceps', '2026-11-08'), undefined);
});
