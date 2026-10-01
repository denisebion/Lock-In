// Your rules, schedule and targets. Edit here until the Settings screen exists.

export const CHALLENGE = {
  start: '2026-10-01',
  end: '2026-12-31',
};

// Days where every rule is optional and streaks are paused (not broken).
export const PAUSES = [
  {
    start: '2026-10-24',
    end: '2026-10-31',
    label: 'Japan trip',
    note: 'Everything is optional. Streaks are paused, not broken. Enjoy Tokyo and Osaka.',
  },
];

// Daily step target ramps up through October, then holds.
export const STEP_RAMP = [
  { from: '2026-10-01', target: 7000 },
  { from: '2026-10-08', target: 8000 },
  { from: '2026-10-15', target: 9000 },
  { from: '2026-10-22', target: 10000 },
];

export const CALORIES = { min: 1200, max: 1800 };

export const RULES = [
  { id: 'move', name: 'Move 30+ minutes', hint: 'Gym, Ballers, or a walk all count' },
  { id: 'steps', name: 'Hit step target', hint: '' },
  { id: 'strength', name: 'Strength session', hint: 'Apartment gym, 30 min' },
  { id: 'kali', name: '10-min calm training with Kali', hint: '' },
  { id: 'calories', name: 'Calories in range', hint: '' },
];

// Rotates by day so each session has a clear focus.
export const KALI_DRILLS = [
  'Mat settle: reward her for lying calmly on her mat.',
  '"Look at me": treat every time she checks in with you.',
  'Trigger watching: stay far enough away that she stays quiet and reward calm looks.',
];

const strengthA = [
  { id: 'lat-pulldown', name: 'Lat pulldown' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'rows', name: 'Rows' },
  { id: 'leg-press', name: 'Leg press' },
  { id: 'biceps', name: 'Biceps curls' },
  { id: 'shoulder-mobility', name: 'Shoulder mobility', detail: 'Halos + resistance band' },
];

const strengthB = [
  { id: 'z-press', name: 'Z press' },
  { id: 'squats', name: 'Squats' },
  { id: 'chest-press', name: 'Chest press' },
  { id: 'calves', name: 'Calf raises' },
  { id: 'flys', name: 'Flys / pecs' },
  { id: 'triceps', name: 'Triceps' },
];

const ballersDay = {
  location: 'WFH',
  title: 'Ballers or a walk',
  summary: 'Ballers covers both Move and Steps today. No Ballers? Walk until you hit your step target.',
  ballersOption: true,
};

const stepDay = {
  location: 'Weekend',
  title: 'Step day',
  summary: 'Get your steps in. A 30-minute walk also counts for Move.',
};

// Keyed by JS getDay(): 0 = Sunday.
export const SCHEDULE = {
  0: { ...stepDay },
  1: {
    location: 'Onsite',
    title: 'Strength A: Pull + Legs',
    summary: '30 min in the apartment gym. Counts for Move too.',
    strength: true,
    exercises: strengthA,
  },
  2: {
    location: 'Onsite',
    title: 'Gym: full body or incline treadmill',
    summary: '30 min. Pick a full-body circuit or an incline treadmill walk, which also builds steps.',
  },
  3: { ...ballersDay },
  4: {
    location: 'Onsite',
    title: 'Strength B: Push + Legs',
    summary: '30 min in the apartment gym. Counts for Move too.',
    strength: true,
    exercises: strengthB,
  },
  5: { ...ballersDay },
  6: { ...stepDay },
};

export const SHOE_TIP_UNTIL = '2026-10-23';
export const SHOE_TIP = 'Walk part of it in your Japan shoes.';
