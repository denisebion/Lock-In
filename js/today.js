import { CHALLENGE, SHOE_TIP, SHOE_TIP_UNTIL } from './config.js';
import * as L from './logic.js';
import * as P from './prefs.js';
import * as S from './store.js';

const fmt = (n) => n.toLocaleString('en-US');
const longDate = (k) =>
  L.fromKey(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const esc = L.esc;

const CHECK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

export function renderToday(root, requestedKey) {
  const today = L.todayKey();
  const key = L.clampToChallenge(requestedKey || today);
  const plan = L.planFor(key);
  const pause = L.pauseFor(key);
  const future = key > today;
  const target = L.stepTarget(key);
  const entry = S.getEntry(key) || { done: {}, lifts: {} };
  const cal = P.calories();
  const exercises = plan.strength ? P.exercises(L.fromKey(key).getDay()) : [];
  const shoeTip = !pause && key <= SHOE_TIP_UNTIL ? SHOE_TIP : '';

  const builtInCopy = {
    move: { name: 'Move 30+ minutes', sub: 'Gym, Ballers, or a walk all count' },
    steps: { name: `Hit ${fmt(target)} steps`, sub: shoeTip || 'Check your phone or watch', input: 'steps' },
    strength: { name: 'Strength session', sub: plan.title },
    calories: { name: `Calories ${fmt(cal.min)}–${fmt(cal.max)}`, sub: 'Log food, land in the range', input: 'calories' },
  };
  // A name set in Settings replaces the default wording.
  const copyFor = (r) => {
    const copy = builtInCopy[r.id] || { name: r.name, sub: '' };
    return r.customName ? { ...copy, name: r.name } : copy;
  };

  root.innerHTML = `
    <header class="day-head">
      <button class="icon-btn" data-nav="-1" aria-label="Previous day" ${key <= CHALLENGE.start ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <div class="day-title">
        <div class="eyebrow">Day ${L.dayNumber(key)} of ${L.TOTAL_DAYS}</div>
        <h1>${longDate(key)}</h1>
      </div>
      <button class="icon-btn" data-nav="1" aria-label="Next day" ${key >= CHALLENGE.end ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    </header>
    ${key !== L.clampToChallenge(today) ? `<a class="jump" href="#today">Back to today</a>` : ''}
    ${banners()}

    <section class="card progress-card">
      <div class="progress-row">
        <span class="progress-text"></span>
        <span class="saved" aria-live="polite"></span>
      </div>
      <div class="bar"><span class="progress-fill"></span></div>
    </section>

    <fieldset class="form" ${future ? 'disabled' : ''}>
      <section class="card plan">
        <div class="tags">
          <span class="tag">${plan.location}</span>
          <span class="tag">${plan.strength ? 'Strength day' : 'Step day'}</span>
        </div>
        <h2>${plan.title}</h2>
        <p class="muted">${plan.summary}</p>
        ${plan.ballersOption ? `
          <div class="segmented" role="group" aria-label="Today's movement">
            <button type="button" data-ballers="1">Ballers</button>
            <button type="button" data-ballers="0">Walk ${fmt(target)} steps</button>
          </div>` : ''}
        ${exercises.length ? exerciseList() : ''}
      </section>

      <section class="card">
        <h3 class="section-label">Check in</h3>
        <div class="rules">
          ${L.applicableRules(key).map((r) => ruleRow(r.id, copyFor(r))).join('')}
        </div>
      </section>

      <section class="card">
        <h3 class="section-label">Mood</h3>
        <div class="mood" role="group" aria-label="Mood, 1 to 5">
          ${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-mood="${i}">${i}</button>`).join('')}
        </div>
        <div class="mood-scale"><span>Rough</span><span>Great</span></div>
        <textarea data-field="note" rows="2" placeholder="Optional note">${esc(entry.note)}</textarea>
      </section>
    </fieldset>

    <p class="streak-line"></p>
  `;

  function banners() {
    const out = [];
    if (today < CHALLENGE.start && key === CHALLENGE.start) {
      const n = L.diffDays(today, CHALLENGE.start);
      out.push(`<div class="banner">Lock In starts ${n === 1 ? 'tomorrow' : `in ${n} days`}. Here's your Day 1 plan.</div>`);
    } else if (future) {
      out.push(`<div class="banner">Upcoming day. You can check in once it arrives.</div>`);
    }
    if (pause) out.push(`<div class="banner pause"><strong>${pause.label}.</strong> ${pause.note}</div>`);
    const yesterday = L.addDays(today, -1);
    if (key === today && new Date().getHours() < 12 && yesterday >= CHALLENGE.start && !L.pauseFor(yesterday)) {
      const st = L.dayStatus(yesterday, S.getEntry(yesterday));
      if (!st.perfect) {
        out.push(`<a class="banner link" href="#today/${yesterday}">Yesterday is at ${st.met}/${st.total}. Finish logging it →</a>`);
      }
    }
    return out.join('');
  }

  function exerciseList() {
    return `
      <ol class="exercises">
        ${exercises.map((ex) => {
          const last = S.lastLift(ex.id, key);
          return `
            <li>
              <div class="ex-name">${ex.name}${ex.detail ? `<span class="muted"> · ${ex.detail}</span>` : ''}</div>
              <label class="weight">
                <input type="text" inputmode="decimal" data-lift="${ex.id}" value="${esc(entry.lifts?.[ex.id])}"
                  placeholder="${last ? esc(last.weight) : '—'}" aria-label="${ex.name} weight in pounds">
                <span>lb</span>
              </label>
              ${last ? `<div class="last">Last: ${esc(last.weight)} lb</div>` : ''}
            </li>`;
        }).join('')}
      </ol>`;
  }

  function ruleRow(id, copy) {
    const value = copy.input ? entry[copy.input] : null;
    return `
      <div class="rule" data-rule="${id}">
        <button type="button" class="check" aria-label="${esc(copy.name)}">${CHECK_ICON}</button>
        <div class="rule-body">
          <div class="rule-name">${esc(copy.name)}</div>
          ${copy.sub ? `<div class="rule-sub">${esc(copy.sub)}</div>` : ''}
          <div class="rule-covered">Covered by Ballers</div>
        </div>
        ${copy.input ? `<input class="mini" type="text" inputmode="numeric" data-field="${copy.input}"
          value="${value ?? ''}" placeholder="${copy.input === 'steps' ? 'steps' : 'kcal'}" aria-label="${copy.input}">` : ''}
      </div>`;
  }

  let savedTimer;
  function save(fn) {
    S.updateEntry(key, fn);
    const el = root.querySelector('.saved');
    el.textContent = 'Saved';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (el.textContent = ''), 1200);
    refresh();
  }

  function refresh() {
    const e = S.getEntry(key);
    const st = L.dayStatus(key, e);
    root.querySelectorAll('.rule').forEach((row) => {
      const id = row.dataset.rule;
      const met = L.ruleMet(key, id, e);
      row.classList.toggle('met', met);
      row.classList.toggle('covered', L.coveredByBallers(key, id, e));
      row.querySelector('.check').setAttribute('aria-pressed', String(met));
    });
    root.querySelectorAll('[data-mood]').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.mood) === e?.mood)));
    root.querySelectorAll('[data-ballers]').forEach((b) =>
      b.setAttribute('aria-pressed', String(typeof e?.ballers === 'boolean' && (b.dataset.ballers === '1') === e.ballers)));

    root.querySelector('.progress-text').innerHTML = st.perfect
      ? `<strong>Perfect day.</strong> ${st.met} of ${st.total} done`
      : `<strong>${st.met} of ${st.total}</strong> done${pause ? ' · optional today' : ''}`;
    root.querySelector('.progress-fill').style.width = `${st.total ? (st.met / st.total) * 100 : 0}%`;
    root.querySelector('.progress-card').classList.toggle('perfect', st.perfect);

    const streak = L.perfectStats(today, S.allDays());
    const line = root.querySelector('.streak-line');
    if (key !== today || today < CHALLENGE.start) {
      line.textContent = '';
    } else if (streak.current > 0 && !st.perfect && !pause) {
      line.innerHTML = `<strong>DON'T LOSE THE STREAK.</strong> ${streak.current} perfect day${streak.current === 1 ? '' : 's'} in a row.`;
    } else if (streak.current > 0) {
      line.textContent = `${streak.current}-day perfect streak.`;
    } else {
      line.textContent = pause ? '' : 'Every streak starts with one perfect day.';
    }
  }

  root.addEventListener('click', (ev) => {
    const nav = ev.target.closest('[data-nav]');
    if (nav) {
      location.hash = `#today/${L.addDays(key, Number(nav.dataset.nav))}`;
      return;
    }
    if (future) return;

    const mood = ev.target.closest('[data-mood]');
    if (mood) {
      const m = Number(mood.dataset.mood);
      save((e) => (e.mood = e.mood === m ? null : m));
      return;
    }
    const ballers = ev.target.closest('[data-ballers]');
    if (ballers) {
      save((e) => (e.ballers = ballers.dataset.ballers === '1'));
      return;
    }
    const row = ev.target.closest('.rule');
    if (row && !ev.target.closest('input') && !row.classList.contains('covered')) {
      const id = row.dataset.rule;
      save((e) => {
        e.done[id] = !e.done[id];
        // A strength session is a 30-min gym session, so it also counts as Move.
        if (id === 'strength' && e.done[id]) e.done.move = true;
      });
    }
  });

  root.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.lift) {
      save((e) => (e.lifts[el.dataset.lift] = el.value.trim()));
      return;
    }
    const field = el.dataset.field;
    if (field === 'note') {
      save((e) => (e.note = el.value));
    } else if (field === 'steps' || field === 'calories') {
      const raw = el.value.replace(/[^\d]/g, '');
      if (raw !== el.value) el.value = raw;
      save((e) => {
        e[field] = raw === '' ? null : Number(raw);
        if (raw === '') return;
        const n = Number(raw);
        e.done[field] = field === 'steps' ? n >= target : n >= cal.min && n <= cal.max;
      });
    }
  });

  refresh();
}
