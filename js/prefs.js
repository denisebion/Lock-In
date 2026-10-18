// Effective rules and targets: defaults from config.js plus edits saved in Settings.
import { RULES, CALORIES, STEP_RAMP, SCHEDULE } from './config.js';
import * as S from './store.js';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const STRENGTH_DAYS = Object.keys(SCHEDULE).map(Number).filter((d) => SCHEDULE[d].strength);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every rule, including ones switched off, for the Settings screen.
export function allRules() {
  const p = S.getPrefs();
  const builtIn = RULES.map((r) => ({
    ...r,
    name: p.names?.[r.id] || r.name,
    customName: !!p.names?.[r.id],
    enabled: p.off?.[r.id] !== true,
  }));
  const custom = (p.custom || []).map((r) => ({ ...r, custom: true, enabled: p.off?.[r.id] !== true }));
  return [...builtIn, ...custom];
}

export const rules = () => allRules().filter((r) => r.enabled);

export const calories = () => ({ ...CALORIES, ...S.getPrefs().calories });

export const stepRamp = () =>
  STEP_RAMP.map((s, i) => ({ ...s, target: S.getPrefs().stepTargets?.[i] ?? s.target }));

// An exercise as one editable line, e.g. "Shoulder mobility (Halos + resistance band)".
export const exerciseLine = (ex) => (ex.detail ? `${ex.name} (${ex.detail})` : ex.name);

export function exercises(weekday) {
  const lines = S.getPrefs().workouts?.[weekday];
  const defaults = SCHEDULE[weekday].exercises || [];
  if (!lines) return defaults;
  // Reuse the default exercise when a line is unchanged so its weight history carries over.
  return lines.map((line) => defaults.find((d) => exerciseLine(d) === line) || { id: slug(line), name: line });
}
