import { CHALLENGE, PAUSES, STEP_RAMP, RULES, SCHEDULE } from './config.js';

// Dates are local-time "YYYY-MM-DD" keys throughout.
const pad = (n) => String(n).padStart(2, '0');
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function fromKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}
export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);

// ?today=2026-10-15 overrides the date, handy for testing.
export function todayKey() {
  const override = new URLSearchParams(location.search).get('today');
  return /^\d{4}-\d{2}-\d{2}$/.test(override || '') ? override : toKey(new Date());
}

export const TOTAL_DAYS = diffDays(CHALLENGE.start, CHALLENGE.end) + 1;
export const dayNumber = (k) => diffDays(CHALLENGE.start, k) + 1;
export const clampToChallenge = (k) =>
  k < CHALLENGE.start ? CHALLENGE.start : k > CHALLENGE.end ? CHALLENGE.end : k;

export const pauseFor = (k) => PAUSES.find((p) => k >= p.start && k <= p.end);
export const planFor = (k) => SCHEDULE[fromKey(k).getDay()];

export function stepTarget(k) {
  let target = STEP_RAMP[0].target;
  for (const step of STEP_RAMP) if (k >= step.from) target = step.target;
  return target;
}

export const isApplicable = (k, ruleId) => ruleId !== 'strength' || !!planFor(k).strength;
export const applicableRules = (k) => RULES.filter((r) => isApplicable(k, r.id));

export const coveredByBallers = (k, ruleId, entry) =>
  !!(planFor(k).ballersOption && entry?.ballers && (ruleId === 'move' || ruleId === 'steps'));

export function ruleMet(k, ruleId, entry) {
  if (!entry) return false;
  return coveredByBallers(k, ruleId, entry) || !!entry.done?.[ruleId];
}

export function dayStatus(k, entry) {
  const rules = applicableRules(k);
  const met = rules.filter((r) => ruleMet(k, r.id, entry)).length;
  return { met, total: rules.length, perfect: met === rules.length };
}

// Challenge days from the start through today.
function elapsedDays(today) {
  const days = [];
  const last = today < CHALLENGE.end ? today : CHALLENGE.end;
  for (let k = CHALLENGE.start; k <= last; k = addDays(k, 1)) days.push(k);
  return days;
}

// test(k) returns true (hit), false (miss) or null (skip: paused / not applicable).
// Today is still in progress, so an unfinished today never breaks a streak.
function streak(today, test) {
  let current = 0, best = 0, hits = 0, attempts = 0;
  for (const k of elapsedDays(today)) {
    const r = test(k);
    if (r === null) continue;
    if (r) {
      current++; hits++; attempts++;
      best = Math.max(best, current);
    } else if (k !== today) {
      current = 0; attempts++;
    }
  }
  return { current, best, hits, attempts, rate: attempts ? hits / attempts : null };
}

export const perfectStats = (today, days) =>
  streak(today, (k) => (pauseFor(k) ? null : dayStatus(k, days[k]).perfect));

export const ruleStats = (ruleId, today, days) =>
  streak(today, (k) =>
    pauseFor(k) || !isApplicable(k, ruleId) ? null : ruleMet(k, ruleId, days[k]));

export function countdown(today) {
  if (today < CHALLENGE.start) {
    return { phase: 'before', startsIn: diffDays(today, CHALLENGE.start), daysLeft: TOTAL_DAYS, day: 0 };
  }
  if (today > CHALLENGE.end) return { phase: 'done', daysLeft: 0, day: TOTAL_DAYS };
  return { phase: 'active', daysLeft: diffDays(today, CHALLENGE.end) + 1, day: dayNumber(today) };
}
