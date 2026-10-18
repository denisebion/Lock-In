import { RULES, CALORIES, STEP_RAMP, SCHEDULE } from './config.js';
import * as L from './logic.js';
import * as P from './prefs.js';
import * as S from './store.js';

const esc = L.esc;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDate = (k) => L.fromKey(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const toNumber = (v) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : null);

export function renderSettings(root) {
  const cal = P.calories();
  const ramp = P.stepRamp();

  root.innerHTML = `
    <header class="page-head">
      <div class="eyebrow">Lock In <span class="saved" aria-live="polite"></span></div>
      <h1>Settings</h1>
    </header>

    <section class="card">
      <h3 class="section-label">Rules</h3>
      <p class="muted small">Turning a rule off removes it from every day, past days included, and your streaks are recounted. Turn it back on and your old check-ins come back.</p>
      <div class="set-rules">${P.allRules().map(ruleRow).join('')}</div>
      <button type="button" class="btn add-btn" data-add>+ Add a rule</button>
    </section>

    <section class="card">
      <h3 class="section-label">Calorie range</h3>
      <div class="field-row">
        <label class="field">Min<input type="text" inputmode="numeric" data-cal="min" value="${cal.min}"></label>
        <label class="field">Max<input type="text" inputmode="numeric" data-cal="max" value="${cal.max}"></label>
      </div>
      <p class="field-error" data-error="cal"></p>
    </section>

    <section class="card">
      <h3 class="section-label">Daily step targets</h3>
      ${ramp.map((s, i) => {
        const next = ramp[i + 1];
        const label = next ? `${shortDate(s.from)} – ${shortDate(L.addDays(next.from, -1))}` : `${shortDate(s.from)} onward`;
        return `<label class="field inline">${label}<input type="text" inputmode="numeric" data-step="${i}" value="${s.target}"></label>`;
      }).join('')}
      <p class="field-error" data-error="steps"></p>
    </section>

    <section class="card">
      <h3 class="section-label">Workouts</h3>
      ${P.STRENGTH_DAYS.map((d) => `
        <label class="field stacked">
          <span><strong>${WEEKDAYS[d]}</strong> · ${esc(SCHEDULE[d].title)}</span>
          <textarea rows="6" data-workout="${d}">${esc(P.exercises(d).map(P.exerciseLine).join('\n'))}</textarea>
        </label>`).join('')}
      <p class="muted small">One exercise per line. Weights you've logged stay with any exercise you don't rename.</p>
    </section>

    <section class="card">
      <h3 class="section-label">Backup</h3>
      <p class="muted small">Your data is saved on this device only. To see it on your laptop, export it here, AirDrop the file over, and import it there.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-export>Export</button>
        <label class="btn">Import<input type="file" accept="application/json,.json" hidden data-import></label>
      </div>
    </section>

    <button type="button" class="btn subtle" data-reset>Reset rules and targets to defaults</button>
  `;

  function ruleRow(r) {
    const defaultName = RULES.find((d) => d.id === r.id)?.name || 'New rule';
    const where = r.id === 'strength'
      ? `<p class="muted small">Only on strength days (${P.STRENGTH_DAYS.map((d) => WEEKDAYS[d].slice(0, 3)).join(' & ')})</p>`
      : '';
    return `
      <div class="set-rule ${r.enabled ? '' : 'off'}" data-id="${r.id}">
        <div class="set-rule-top">
          <input type="text" class="name-input" data-name value="${esc(r.custom || r.customName ? r.name : '')}"
            placeholder="${esc(defaultName)}" aria-label="Rule name">
          <label class="switch" aria-label="Rule on">
            <input type="checkbox" data-toggle ${r.enabled ? 'checked' : ''}><span></span>
          </label>
        </div>
        ${where}
        ${r.custom ? `
          <div class="days" role="group" aria-label="Days this rule applies">
            ${P.ALL_DAYS.map((d) => `<button type="button" data-day="${d}" aria-pressed="${r.days.includes(d)}"
              aria-label="${WEEKDAYS[d]}">${WEEKDAYS[d][0]}</button>`).join('')}
          </div>
          <button type="button" class="link-danger" data-delete>Delete rule</button>` : ''}
      </div>`;
  }

  // Swap in a fresh element so event listeners aren't attached twice.
  function rerender() {
    const fresh = root.cloneNode(false);
    root.replaceWith(fresh);
    renderSettings(fresh);
    return fresh;
  }

  let savedTimer;
  function save(fn) {
    S.updatePrefs(fn);
    const el = root.querySelector('.saved');
    el.textContent = '· Saved';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (el.textContent = ''), 1200);
  }
  const showError = (name, msg) => (root.querySelector(`[data-error="${name}"]`).textContent = msg);
  const customIndex = (p, id) => (p.custom || []).findIndex((c) => c.id === id);

  root.addEventListener('click', (ev) => {
    const t = ev.target;
    const row = t.closest('.set-rule');
    const id = row?.dataset.id;

    if (t.closest('[data-add]')) {
      const newId = `c${Date.now().toString(36)}`;
      save((p) => (p.custom = [...(p.custom || []), { id: newId, name: 'New rule', days: P.ALL_DAYS, since: L.todayKey() }]));
      const input = rerender().querySelector(`[data-id="${newId}"] [data-name]`);
      input.focus();
      input.select();
    } else if (t.closest('[data-day]')) {
      const day = Number(t.closest('[data-day]').dataset.day);
      save((p) => {
        const rule = p.custom[customIndex(p, id)];
        const days = rule.days.includes(day) ? rule.days.filter((d) => d !== day) : [...rule.days, day].sort();
        if (days.length) rule.days = days; // keep at least one day
      });
      const days = P.allRules().find((r) => r.id === id).days;
      row.querySelectorAll('[data-day]').forEach((b) =>
        b.setAttribute('aria-pressed', String(days.includes(Number(b.dataset.day)))));
    } else if (t.closest('[data-delete]')) {
      const name = P.allRules().find((r) => r.id === id).name;
      if (!confirm(`Delete "${name}"?`)) return;
      save((p) => {
        p.custom.splice(customIndex(p, id), 1);
        if (p.off) delete p.off[id];
      });
      rerender();
    } else if (t.closest('[data-export]')) {
      S.exportJSON();
    } else if (t.closest('[data-reset]')) {
      if (!confirm('Reset all rules, targets and workouts to the defaults? Your check-ins are kept.')) return;
      S.resetPrefs();
      rerender();
    }
  });

  root.addEventListener('change', async (ev) => {
    const t = ev.target;
    const id = t.closest('.set-rule')?.dataset.id;

    if (t.matches('[data-toggle]')) {
      save((p) => {
        p.off = { ...p.off };
        if (t.checked) delete p.off[id];
        else p.off[id] = true;
      });
      t.closest('.set-rule').classList.toggle('off', !t.checked);
    } else if (t.matches('[data-name]')) {
      const name = t.value.trim();
      save((p) => {
        const i = customIndex(p, id);
        if (i >= 0) {
          p.custom[i].name = name || 'New rule';
        } else {
          p.names = { ...p.names };
          const isDefault = !name || name === RULES.find((d) => d.id === id).name;
          if (isDefault) delete p.names[id];
          else p.names[id] = name;
        }
      });
      if (!name && customIndex(S.getPrefs(), id) >= 0) t.value = 'New rule';
    } else if (t.matches('[data-import]')) {
      const file = t.files[0];
      if (!file || !confirm('Replace the data on this device with this backup?')) return;
      try {
        S.importJSON(await file.text());
        rerender();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  root.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.matches('[data-cal]')) {
      const min = toNumber(root.querySelector('[data-cal="min"]').value);
      const max = toNumber(root.querySelector('[data-cal="max"]').value);
      if (!min || !max || min > max) return showError('cal', 'Enter whole numbers, with Min no higher than Max.');
      showError('cal', '');
      save((p) => {
        if (min === CALORIES.min && max === CALORIES.max) delete p.calories;
        else p.calories = { min, max };
      });
    } else if (t.matches('[data-step]')) {
      const values = [...root.querySelectorAll('[data-step]')].map((el) => toNumber(el.value));
      if (values.some((v) => !v)) return showError('steps', 'Enter a whole number for every week.');
      showError('steps', '');
      save((p) => {
        if (values.every((v, i) => v === STEP_RAMP[i].target)) delete p.stepTargets;
        else p.stepTargets = values;
      });
    } else if (t.matches('[data-workout]')) {
      const day = t.dataset.workout;
      const lines = t.value.split('\n').map((l) => l.trim()).filter(Boolean);
      const defaults = (SCHEDULE[day].exercises || []).map(P.exerciseLine);
      save((p) => {
        p.workouts = { ...p.workouts };
        if (lines.join('\n') === defaults.join('\n')) delete p.workouts[day];
        else p.workouts[day] = lines;
      });
    }
  });
}
