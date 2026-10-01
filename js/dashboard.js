import { CHALLENGE, PAUSES, RULES, STEP_RAMP } from './config.js';
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
  const rules = RULES.map((r) => ({ ...r, ...L.ruleStats(r.id, today, days) }));
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
              <td>${r.name}</td>
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
        ${STEP_RAMP.map((s, i) => {
          const next = STEP_RAMP[i + 1];
          const active = today >= s.from && (!next || today < next.from);
          return `<li class="${active ? 'active' : ''}"><span>${next ? `${shortDate(s.from)} – ${shortDate(L.addDays(next.from, -1))}` : `${shortDate(s.from)} onward`}</span><span>${fmt(s.target)}</span></li>`;
        }).join('')}
      </ul>
      ${PAUSES.map((p) => `<p class="muted small">${p.label}, ${shortDate(p.start)} – ${shortDate(p.end)}: rules optional, streaks paused.</p>`).join('')}
    </section>

    <section class="card">
      <h3 class="section-label">Backup</h3>
      <p class="muted small">Data is saved on this device only. To view it on your laptop, export it here, AirDrop the file over, and import it there.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-action="export">Export</button>
        <label class="btn">Import<input type="file" accept="application/json,.json" hidden data-action="import"></label>
      </div>
    </section>
  `;

  root.querySelector('[data-action="export"]').addEventListener('click', S.exportJSON);
  root.querySelector('[data-action="import"]').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    if (!confirm('Replace the data on this device with this backup?')) return;
    try {
      S.importJSON(await file.text());
      renderDashboard(root);
    } catch (err) {
      alert(err.message);
    }
  });
}
