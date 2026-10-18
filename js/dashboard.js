import { CHALLENGE, PAUSES } from './config.js';
import * as P from './prefs.js';
import * as L from './logic.js';
import * as S from './store.js';

const fmt = (n) => n.toLocaleString('en-US');
const shortDate = (k) => L.fromKey(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const pct = (r) => (r === null ? '—' : `${Math.round(r * 100)}%`);

export function renderDashboard(root) {
  const today = L.todayKey();
  const days = S.allDays();
  const cd = L.countdown(today);
  const perfect = L.perfectStats(today, days);
  const rules = P.rules().map((r) => ({ ...r, ...L.ruleStats(r, today, days) }));
  const ramp = P.stepRamp();
  const target = L.stepTarget(L.clampToChallenge(today));
  const logged = Object.keys(days).filter((k) => k >= CHALLENGE.start && k <= CHALLENGE.end).length;
  const elapsedPct = (cd.day / L.TOTAL_DAYS) * 100;

  const heroLabel = {
    before: `Starts ${cd.startsIn === 1 ? 'tomorrow' : `in ${cd.startsIn} days`}`,
    active: `Day ${cd.day} of ${L.TOTAL_DAYS}`,
    done: 'You made it through 2026',
  }[cd.phase];

  root.innerHTML = `
    <header class="page-head">
      <div class="eyebrow">Lock In · ${shortDate(CHALLENGE.start)} – ${shortDate(CHALLENGE.end)}</div>
      <h1>Dashboard</h1>
    </header>

    <section class="card hero">
      <div class="big">${cd.daysLeft}</div>
      <div class="big-label">day${cd.daysLeft === 1 ? '' : 's'} left in 2026</div>
      <div class="bar"><span style="width:${elapsedPct}%"></span></div>
      <div class="muted small">${heroLabel}</div>
    </section>

    <section class="card hero">
      <div class="eyebrow">Perfect-day streak</div>
      <div class="big">${perfect.current}</div>
      <div class="big-label">current · best ${perfect.best}</div>
      ${cd.phase === 'active' ? `<p class="push">DON'T LOSE THE STREAK</p>` : ''}
    </section>

    <div class="stat-grid">
      <div class="stat"><div class="stat-num">${perfect.hits}</div><div class="stat-label">Perfect days</div></div>
      <div class="stat"><div class="stat-num">${pct(perfect.rate)}</div><div class="stat-label">Perfect rate</div></div>
      <div class="stat"><div class="stat-num">${logged}</div><div class="stat-label">Days logged</div></div>
      <div class="stat"><div class="stat-num">${fmt(target)}</div><div class="stat-label">Step target now</div></div>
    </div>

    <section class="card">
      <h3 class="section-label">Rules</h3>
      <table class="rule-table">
        <thead><tr><th>Rule</th><th>Streak</th><th>Best</th><th>Hit rate</th></tr></thead>
        <tbody>
          ${rules.map((r) => `
            <tr>
              <td>${L.esc(r.name)}</td>
              <td class="num">${r.current}</td>
              <td class="num">${r.best}</td>
              <td class="num">${pct(r.rate)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h3 class="section-label">Step ramp</h3>
      <ul class="ramp">
        ${ramp.map((s, i) => {
          const next = ramp[i + 1];
          const active = today >= s.from && (!next || today < next.from);
          return `<li class="${active ? 'active' : ''}"><span>${next ? `${shortDate(s.from)} – ${shortDate(L.addDays(next.from, -1))}` : `${shortDate(s.from)} onward`}</span><span>${fmt(s.target)}</span></li>`;
        }).join('')}
      </ul>
      ${PAUSES.map((p) => `<p class="muted small">${p.label}, ${shortDate(p.start)} – ${shortDate(p.end)}: rules optional, streaks paused.</p>`).join('')}
    </section>
  `;
}
