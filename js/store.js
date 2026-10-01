// All check-ins live in this browser's localStorage under one key.
const KEY = 'lockin.v1';

let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved.days === 'object') return saved;
  } catch {}
  return { version: 1, days: {} };
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Could not save', err);
  }
}

export const getEntry = (k) => state.days[k];
export const allDays = () => state.days;

export function updateEntry(k, fn) {
  const entry = structuredClone(state.days[k] || {});
  entry.done ??= {};
  entry.lifts ??= {};
  fn(entry);
  entry.updatedAt = new Date().toISOString();
  state.days[k] = entry;
  save();
  return entry;
}

// Most recent weight logged for an exercise before a given day.
export function lastLift(exerciseId, beforeKey) {
  const keys = Object.keys(state.days).filter((k) => k < beforeKey).sort().reverse();
  for (const k of keys) {
    const w = state.days[k].lifts?.[exerciseId];
    if (w) return { weight: w, date: k };
  }
  return null;
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lock-in-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data.days !== 'object') throw new Error('That file is not a Lock In backup.');
  state = data;
  save();
}
