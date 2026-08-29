// Route screens: dashboard, add transaction, list, reports.

import {
  state, summarize, totalBudget, daysSinceExport, periodTransactions,
  addTransaction, softDeleteTransaction, restoreTransaction,
  addTemplate, categoryById, categoryBySlug, saveSettings,
} from './store.js';
import {
  $, $$, esc, fmtMoney, parseAmount, evalLine, todayISO, toISODate,
  periodFor, shiftPeriod, periodLabel, periodProgress, fmtDay, toast,
} from './util.js';
import * as charts from './charts.js';

const DRAFT_KEY = 'budget.draft';

function bindNav(root) {
  $$('[data-go]', root).forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; }));
}

function txRow(t) {
  const cat = categoryById(t.categoryId);
  const sign = t.type === 'income' ? '+' : '−';
  return `
    <div class="tx-row" data-id="${esc(t.id)}">
      <button class="tx-delete" type="button" aria-label="Delete transaction">Delete</button>
      <div class="tx-content">
        <span class="tx-icon" style="background:${esc(cat.color)}22">${cat.icon}</span>
        <span class="tx-main">
          <span class="tx-title">${esc(t.note || cat.name)}</span>
          <span class="tx-sub">${esc(cat.name)} · ${fmtDay(t.date)}</span>
        </span>
        <span class="tx-amount ${t.type}">${sign}${fmtMoney(t.amountCents, state.settings.currency)}</span>
      </div>
    </div>`;
}

function bindTxRows(root, ctx) {
  $$('.tx-row', root).forEach(row => {
    const id = row.dataset.id;
    const content = row.querySelector('.tx-content');
    row.querySelector('.tx-delete').addEventListener('click', () => removeTx(id, ctx));

    // Swipe left to reveal Delete (pointer events cover touch + mouse).
    let startX = 0, dx = 0, dragging = false;
    content.addEventListener('pointerdown', e => {
      startX = e.clientX; dx = 0; dragging = true;
      content.setPointerCapture(e.pointerId);
      content.style.transition = 'none';
    });
    content.addEventListener('pointermove', e => {
      if (!dragging) return;
      dx = Math.min(0, e.clientX - startX);
      content.style.transform = `translateX(${dx}px)`;
    });
    const finish = () => {
      if (!dragging) return;
      dragging = false;
      content.style.transition = '';
      if (dx < -72) { content.style.transform = 'translateX(-84px)'; row.classList.add('revealed'); }
      else { content.style.transform = ''; row.classList.remove('revealed'); }
    };
    content.addEventListener('pointerup', finish);
    content.addEventListener('pointercancel', finish);
  });
}

async function removeTx(id, ctx) {
  const t = await softDeleteTransaction(id);
  if (!t) return;
  toast('Deleted', { actionLabel: 'Undo', onAction: async () => { await restoreTransaction(id); ctx.refresh(); } });
  ctx.refresh();
}

// --- Dashboard #/ -----------------------------------------------------------

export function renderDashboard(root, params, ctx) {
  const cur = state.settings.currency;
  const startDay = state.settings.monthStartDay;
  const { start, end } = periodFor(null, startDay);
  const s = summarize(start, end);
  const budget = totalBudget();
  const remaining = budget - s.expense;
  const prog = periodProgress(start, end);
  const expected = Math.round(budget * prog.ratio);
  const diff = expected - s.expense;
  const pct = budget > 0 ? Math.min(100, (s.expense / budget) * 100) : 0;
  const over = budget > 0 && s.expense > budget;
  const todaySpend = s.daily[todayISO()] || 0;
  const daysLeft = Math.max(1, prog.total - prog.elapsed + 1); // includes today
  const dailyAllowance = budget > 0 && remaining > 0 ? Math.round(remaining / daysLeft) : 0;
  const todayOver = budget > 0 && remaining > 0 && todaySpend > dailyAllowance;

  // "Left per day" scope: overall budget or a single category (persisted).
  const scopes = [{ id: 'all', name: 'All budgets' }]
    .concat(state.categories.filter(c => !c.archived)
      .map(c => ({ id: c.id, name: `${c.icon} ${c.name}`, cap: c.monthlyBudgetCents || 0, spent: s.byCat[c.id] || 0 })));
  let scopeId = state.settings.dailyScope || 'all';
  if (!scopes.some(sc => sc.id === scopeId)) scopeId = 'all';
  const scopeIdx = scopes.findIndex(sc => sc.id === scopeId);
  const scope = scopes[scopeIdx];
  const scopeCap = scopeId === 'all' ? budget : scope.cap;
  const scopeSpent = scopeId === 'all' ? s.expense : scope.spent;
  const scopeRemaining = scopeCap - scopeSpent;
  const scopeDaily = scopeCap > 0 && scopeRemaining > 0 ? Math.round(scopeRemaining / daysLeft) : 0;
  const dse = daysSinceExport();
  const budgetRows = state.categories
    .filter(c => !c.archived)
    .map(c => ({ cat: c, spent: s.byCat[c.id] || 0 }))
    .sort((a, b) => (b.cat.monthlyBudgetCents || 0) - (a.cat.monthlyBudgetCents || 0));
  const anyBudget = budgetRows.some(r => r.cat.monthlyBudgetCents > 0);
  const recent = s.tx.slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  if (params.get('saved') === '1') {
    toast('Transaction saved');
    history.replaceState(null, '', '#/');
  }

  const R = 52;
  const C = (2 * Math.PI * R).toFixed(1);
  const offset = (C * (1 - pct / 100)).toFixed(1);

  root.innerHTML = `
    <header class="screen-head">
      <h1>${esc(periodLabel(start, startDay))}</h1>
      <p class="muted">Day ${prog.elapsed} of ${prog.total}</p>
    </header>

    ${(dse === null || dse > 7) ? `
      <button class="banner" data-go="#/settings" type="button">
        ${dse === null ? 'No backup yet — tap to export your data' : `Last backup ${dse} day${dse === 1 ? '' : 's'} ago — tap to export`}
      </button>` : ''}

    <section class="card ring-card">
      <div class="ring-wrap">
        <svg class="ring ${over ? 'over' : ''}" viewBox="0 0 120 120" role="img" aria-label="${pct.toFixed(0)}% of budget used">
          <circle class="ring-track" cx="60" cy="60" r="${R}"></circle>
          <circle class="ring-fill" cx="60" cy="60" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-center">
          <strong class="${fmtMoney(remaining, cur).length > 9 ? 'sm' : ''}">${fmtMoney(remaining, cur)}</strong>
          <span>${remaining >= 0 ? 'left' : 'over'}</span>
        </div>
      </div>
      <div class="ring-stats">
        <p class="big">${fmtMoney(s.expense, cur)}</p>
        <p class="muted">spent of ${fmtMoney(budget, cur)}</p>
        ${budget > 0 ? `<p class="pace ${diff >= 0 ? 'ok' : 'bad'}">${diff >= 0 ? `${fmtMoney(diff, cur)} ahead of pace` : `${fmtMoney(-diff, cur)} behind pace`}</p>` : ''}
      </div>
    </section>

    <section class="stat-grid two">
      <div class="card stat">
        <span class="muted">Today</span>
        <strong class="${todayOver ? 'bad' : ''}">${fmtMoney(todaySpend, cur)}</strong>
      </div>
      <div class="card stat">
        <div class="scope-nav">
          <button class="scope-btn" id="scope-prev" type="button" aria-label="Previous category">&#8249;</button>
          <span class="muted scope-label">${esc(scope.name)} / day</span>
          <button class="scope-btn" id="scope-next" type="button" aria-label="Next category">&#8250;</button>
        </div>
        <strong class="${scopeCap > 0 && scopeSpent > scopeCap ? 'bad' : ''}">${scopeCap > 0 ? fmtMoney(scopeDaily, cur) : '—'}</strong>
        <span class="muted tiny">${scopeCap > 0
          ? (scopeRemaining > 0 ? `${fmtMoney(scopeRemaining, cur)} left · ${daysLeft}d` : `${fmtMoney(-scopeRemaining, cur)} over cap`)
          : 'no cap set'}</span>
      </div>
    </section>

    ${state.templates.length ? `
      <section class="card">
        <h2 class="card-title">Quick add</h2>
        <div class="chips">
          ${state.templates.map(t => `
            <button class="chip" type="button" data-tpl="${esc(t.id)}">
              ${esc(t.label)} · ${fmtMoney(t.amountCents, cur)}
            </button>`).join('')}
        </div>
      </section>` : ''}

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">Budgets</h2>
        <button class="link" data-go="#/settings" type="button">Edit</button>
      </div>
      ${anyBudget ? budgetRows.map(({ cat, spent }) => {
        const cap = cat.monthlyBudgetCents;
        const pct = cap > 0 ? spent / cap : 0;
        const over = cap > 0 && spent > cap;
        return `
          <div class="budget-row">
            <div class="budget-row-head">
              <span>${cat.icon} ${esc(cat.name)}</span>
              <span class="${over ? 'bad' : 'muted'}">${cap > 0 ? `${fmtMoney(spent, cur)} of ${fmtMoney(cap, cur)}` : spent ? `${fmtMoney(spent, cur)} · no cap` : 'No cap'}</span>
            </div>
            ${cap > 0 ? `<span class="bar-track"><span class="bar-fill ${over ? 'over' : ''}" style="width:${Math.min(100, pct * 100).toFixed(1)}%;${over ? '' : `background:${esc(cat.color)};`}"></span></span>` : ''}
          </div>`;
      }).join('') : `
        <div class="empty">
          <p>No budgets set yet.</p>
          <button class="btn ghost" data-go="#/settings" type="button">Calculate from salary</button>
        </div>`}
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">Recent</h2>
        <button class="link" data-go="#/list" type="button">See all</button>
      </div>
      ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>` : `
        <div class="empty">
          <p>No transactions yet.</p>
          <button class="btn primary" data-go="#/add" type="button">Add your first</button>
          <button class="btn ghost" data-go="#/settings" type="button">Set up a Shortcut</button>
        </div>`}
    </section>`;

  bindNav(root);
  bindTxRows(root, ctx);

  const cycleScope = async dir => {
    const next = (scopeIdx + dir + scopes.length) % scopes.length;
    await saveSettings({ dailyScope: scopes[next].id });
    ctx.refresh();
  };
  $('#scope-prev', root).addEventListener('click', () => cycleScope(-1));
  $('#scope-next', root).addEventListener('click', () => cycleScope(1));
  $$('[data-tpl]', root).forEach(chip => chip.addEventListener('click', async () => {
    const tpl = state.templates.find(t => t.id === chip.dataset.tpl);
    if (!tpl) return;
    const rec = await addTransaction({
      type: tpl.type, amountCents: tpl.amountCents, categoryId: tpl.categoryId,
      note: tpl.note, source: 'manual',
    });
    toast(`Saved ${fmtMoney(rec.amountCents, cur)} to ${categoryById(rec.categoryId).name}`, {
      actionLabel: 'Undo',
      onAction: async () => { await softDeleteTransaction(rec.id); ctx.refresh(); },
    });
    ctx.refresh();
  }));
}

// --- Add transaction #/add ----------------------------------------------------

// Single-expression calculator keypad: + − × ÷ build one arithmetic
// expression (shown verbatim, live result preview). '=' evaluates in place —
// the expression collapses to its result and stays editable. The separate
// Save button commits exactly one transaction.
export function renderAdd(root, params, ctx) {
  const cur = state.settings.currency;
  const fromLink = ['amount', 'category', 'note', 'type', 'date'].some(k => params.get(k));
  let draft = null;
  if (!fromLink) {
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { draft = null; }
  }

  const amountParam = parseAmount(params.get('amount'));
  const form = {
    current: fromLink ? (amountParam != null ? (amountParam / 100).toString() : '') : (draft?.current || ''),
    type: params.get('type') === 'income' ? 'income' : (draft?.type || 'expense'),
    categoryId: fromLink
      ? categoryBySlug(params.get('category')).id
      : (draft?.categoryId || state.categories.find(c => !c.archived)?.id),
    note: params.get('note') ?? draft?.note ?? '',
    date: params.get('date') || draft?.date || todayISO(),
  };
  if (params.get('source') === 'shortcut') form.source = 'shortcut';

  const cats = state.categories.filter(c => !c.archived);

  root.innerHTML = `
    <header class="screen-head with-back">
      <button class="link" data-go="#/" type="button">&larr; Cancel</button>
      <h1>Add transaction</h1><span class="head-spacer"></span>
    </header>

    <div class="seg" role="group" aria-label="Type">
      <button type="button" data-type="expense" class="${form.type === 'expense' ? 'active' : ''}">Expense</button>
      <button type="button" data-type="income" class="${form.type === 'income' ? 'active' : ''}">Income</button>
    </div>

    <div class="calc-display ${form.type}">
      <div class="calc-expr" id="calc-expr" aria-live="polite">RM 0</div>
      <div class="calc-eval muted" id="calc-eval"></div>
    </div>

    <div class="keypad calc" id="keypad">
      <button type="button" class="key key-util" data-key="C">C</button>
      <button type="button" class="key key-util" data-key="del" aria-label="Backspace">&#9003;</button>
      <button type="button" class="key key-op" data-key="×">×</button>
      <button type="button" class="key key-op" data-key="÷">÷</button>
      <button type="button" class="key" data-key="7">7</button>
      <button type="button" class="key" data-key="8">8</button>
      <button type="button" class="key" data-key="9">9</button>
      <button type="button" class="key key-op" data-key="−">−</button>
      <button type="button" class="key" data-key="4">4</button>
      <button type="button" class="key" data-key="5">5</button>
      <button type="button" class="key" data-key="6">6</button>
      <button type="button" class="key key-op key-plus" data-key="+">+</button>
      <button type="button" class="key" data-key="1">1</button>
      <button type="button" class="key" data-key="2">2</button>
      <button type="button" class="key" data-key="3">3</button>
      <button type="button" class="key" data-key=".">.</button>
      <button type="button" class="key key-zero" data-key="0">0</button>
      <button type="button" class="key key-eq" data-key="=" aria-label="Equals">=</button>
    </div>

    <section class="card">
      <h2 class="card-title">Category</h2>
      <div class="chips" id="cat-chips">
        ${cats.map(c => `
          <button class="chip ${c.id === form.categoryId ? 'active' : ''}" type="button" data-cat="${esc(c.id)}">
            ${c.icon} ${esc(c.name)}
          </button>`).join('')}
      </div>
      <div class="field-row">
        <label class="field">
          <span>Date</span>
          <input type="date" id="f-date" value="${esc(form.date)}">
        </label>
        <label class="field grow">
          <span>Note</span>
          <input type="text" id="f-note" maxlength="80" placeholder="e.g. lunch with Ali" value="${esc(form.note)}" autocomplete="off">
        </label>
      </div>
      ${state.templates_notes.length ? `
        <div class="chips scroll nt-chips" id="nt-chips" aria-label="Note templates">
          ${state.templates_notes.map(t => `
            <button class="chip" type="button" data-nt="${esc(t.id)}">${esc(t.label)}</button>`).join('')}
        </div>` : ''}
      <label class="check">
        <input type="checkbox" id="f-tpl">
        <span>Save as quick-add template</span>
      </label>
    </section>

    <button class="btn primary block" id="btn-save" type="button" disabled>Save</button>`;

  const exprEl = $('#calc-expr', root);
  const evalEl = $('#calc-eval', root);
  const tplCheck = $('#f-tpl', root);
  const saveBtn = $('#btn-save', root);
  const displayWrap = $('.calc-display', root);

  function saveDraft() {
    if (form.current || form.note) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    else localStorage.removeItem(DRAFT_KEY);
  }

  // Raw-expression display: "5+5" shows as "RM 5 + 5" with a live result below.
  // Partial input is never re-parsed for display, so "5." can't flash to RM 0.
  function renderCalc() {
    const cents = evalLine(form.current);
    const hasOps = /[+×÷−]/.test(form.current);
    const pretty = form.current.replace(/([+×÷−])/g, ' $1 ');
    exprEl.textContent = form.current === '' ? 'RM 0' : `RM ${pretty}`;
    evalEl.textContent = hasOps && cents != null ? `= ${fmtMoney(cents, cur)}` : '';
    displayWrap.classList.toggle('income', form.type === 'income');
    displayWrap.classList.toggle('expense', form.type !== 'income');
    saveBtn.disabled = !(cents != null && cents > 0);
    saveDraft();
  }

  const lastSeg = () => form.current.split(/[+×÷−]/).pop();

  async function submit() {
    const cents = evalLine(form.current);
    if (!cents || cents <= 0) { toast('Enter a valid amount first'); return; }
    try {
      const rec = await addTransaction({
        type: form.type, amountCents: cents, categoryId: form.categoryId,
        note: form.note, date: form.date, source: form.source || 'manual',
      });
      if (tplCheck.checked) {
        await addTemplate({
          label: form.note.trim() || categoryById(form.categoryId).name,
          type: form.type, amountCents: cents, categoryId: form.categoryId, note: form.note,
        });
      }
    } catch {
      toast('Could not save — please try again');
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    toast(`Saved ${fmtMoney(cents, cur)} to ${categoryById(form.categoryId).name}`, {
      actionLabel: 'Undo',
      onAction: async () => { await softDeleteTransaction(rec.id); ctx.refresh(); },
    });
    const xs = params.get('x-success');
    if (xs) setTimeout(() => { location.href = xs; }, 900);
    else location.hash = '#/';
  }

  $('#keypad', root).addEventListener('click', e => {
    const key = e.target.closest('.key')?.dataset.key;
    if (!key) return;

    if (/^\d$/.test(key)) {
      const seg = lastSeg();
      if (seg.includes('.')) { if (seg.split('.')[1].length >= 2) return; }
      else if (seg.length >= 7) return;
      if (seg === '0') form.current = form.current.slice(0, -1) + key;
      else form.current += key;
    } else if (key === '.') {
      const seg = lastSeg();
      if (seg.includes('.')) return;
      form.current += seg === '' ? '0.' : '.';
    } else if (key === 'C') {
      form.current = '';
    } else if (key === 'del') {
      form.current = form.current.slice(0, -1);
    } else if (key === '=') {
      // Evaluate in place, calculator-style: the expression collapses to its
      // result and stays editable for chained math. Saving is Save's job.
      const result = evalLine(form.current);
      if (result == null) { toast('Complete the expression first'); return; }
      if (result <= 0) { toast('Result must be above zero'); return; }
      form.current = (result / 100).toFixed(2).replace(/\.?0+$/u, ''); // 1000→"10", 1050→"10.5"
    } else { // + − × ÷
      if (form.current === '') return;
      if (/[+×÷−]$/.test(form.current)) form.current = form.current.slice(0, -1) + key;
      else form.current += key;
    }
    renderCalc();
  });

  saveBtn.addEventListener('click', submit);

  $$('.seg [data-type]', root).forEach(b => b.addEventListener('click', () => {
    form.type = b.dataset.type;
    $$('.seg [data-type]', root).forEach(x => x.classList.toggle('active', x === b));
    renderCalc();
  }));

  $('#cat-chips', root).addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    form.categoryId = btn.dataset.cat;
    $$('#cat-chips .chip', root).forEach(x => x.classList.toggle('active', x === btn));
    saveDraft();
  });

  $('#f-date', root).addEventListener('change', e => { form.date = e.target.value || todayISO(); saveDraft(); });
  $('#f-note', root).addEventListener('input', e => { form.note = e.target.value; saveDraft(); });

  // Note-template bubbles: tap writes the label into the note field (still editable).
  $('#nt-chips', root)?.addEventListener('click', e => {
    const btn = e.target.closest('[data-nt]');
    const t = btn && state.templates_notes.find(x => x.id === btn.dataset.nt);
    if (!t) return;
    form.note = t.label;
    const noteInput = $('#f-note', root);
    noteInput.value = t.label;
    noteInput.focus();
    saveDraft(); // draft already covers the note field — keep it in sync
  });

  bindNav(root);
  renderCalc();
}

// --- Transactions #/list --------------------------------------------------------

const listState = { offset: 0, cat: 'all', q: '' };

export function renderList(root, params, ctx) {
  const cur = state.settings.currency;
  const startDay = state.settings.monthStartDay;
  const curStart = periodFor(null, startDay).start;
  const start = shiftPeriod(curStart, startDay, listState.offset);
  const end = shiftPeriod(start, startDay, 1);

  const q = listState.q.trim().toLowerCase();
  const tx = periodTransactions(start, end)
    .filter(t => listState.cat === 'all' || t.categoryId === listState.cat)
    .filter(t => !q || t.note.toLowerCase().includes(q)
      || categoryById(t.categoryId).name.toLowerCase().includes(q)
      || (t.amountCents / 100).toFixed(2).includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const total = tx.filter(t => t.type !== 'income').reduce((s2, t) => s2 + t.amountCents, 0);
  const cats = state.categories.filter(c => !c.archived);

  root.innerHTML = `
    <header class="screen-head">
      <h1>Transactions</h1>
      <div class="period-nav">
        <button class="link" id="prev" type="button" aria-label="Previous period">&larr;</button>
        <span>${esc(periodLabel(start, startDay))}</span>
        <button class="link" id="next" type="button" aria-label="Next period" ${listState.offset === 0 ? 'disabled' : ''}>&rarr;</button>
      </div>
    </header>

    <input type="search" id="q" class="search" placeholder="Search notes, categories, amounts…"
           value="${esc(listState.q)}" autocomplete="off">

    <div class="chips scroll" id="filters">
      <button class="chip ${listState.cat === 'all' ? 'active' : ''}" data-cat="all" type="button">All</button>
      ${cats.map(c => `<button class="chip ${listState.cat === c.id ? 'active' : ''}" data-cat="${esc(c.id)}" type="button">${c.icon} ${esc(c.name)}</button>`).join('')}
    </div>

    <p class="muted list-total">${tx.length} transaction${tx.length === 1 ? '' : 's'} · ${fmtMoney(total, cur)} spent</p>

    <div class="tx-list" id="tx-list">
      ${tx.length ? tx.map(txRow).join('') : '<p class="muted">Nothing here. Try another period or filter.</p>'}
    </div>`;

  $('#prev', root).addEventListener('click', () => { listState.offset--; ctx.refresh(); });
  $('#next', root).addEventListener('click', () => { if (listState.offset < 0) { listState.offset++; ctx.refresh(); } });
  $('#filters', root).addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (btn) { listState.cat = btn.dataset.cat; ctx.refresh(); }
  });
  $('#q', root).addEventListener('input', e => {
    listState.q = e.target.value;
    // Re-render only the list so the search field keeps focus.
    const q2 = listState.q.trim().toLowerCase();
    const filtered = periodTransactions(start, end)
      .filter(t => listState.cat === 'all' || t.categoryId === listState.cat)
      .filter(t => !q2 || t.note.toLowerCase().includes(q2)
        || categoryById(t.categoryId).name.toLowerCase().includes(q2)
        || (t.amountCents / 100).toFixed(2).includes(q2))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    const list = $('#tx-list', root);
    list.innerHTML = filtered.length ? filtered.map(txRow).join('') : '<p class="muted">No matches.</p>';
    bindTxRows(list, ctx);
  });

  bindTxRows($('#tx-list', root), ctx);
}

// --- Reports #/reports ----------------------------------------------------------

const repState = { offset: 0 };

export function renderReports(root, params, ctx) {
  const cur = state.settings.currency;
  const startDay = state.settings.monthStartDay;
  const curStart = periodFor(null, startDay).start;
  const start = shiftPeriod(curStart, startDay, repState.offset);
  const end = shiftPeriod(start, startDay, 1);
  const s = summarize(start, end);
  const net = s.income - s.expense;
  const now = new Date();

  // Cumulative daily expense points up to today (or period end).
  const points = [];
  let cum = 0, dayIdx = 0;
  for (let d = new Date(start); d < end && d <= now; d.setDate(d.getDate() + 1)) {
    dayIdx++;
    cum += s.daily[toISODate(new Date(d))] || 0;
    points.push({ x: dayIdx, y: cum });
  }

  const catData = Object.entries(s.byCat)
    .map(([id, value]) => ({ label: `${categoryById(id).icon} ${categoryById(id).name}`, value, color: categoryById(id).color }))
    .sort((a, b) => b.value - a.value);

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const pStart = shiftPeriod(curStart, startDay, -i);
    const pEnd = shiftPeriod(pStart, startDay, 1);
    const ps = summarize(pStart, pEnd);
    months.push({
      label: pStart.toLocaleDateString('en-MY', { month: 'short' }),
      expense: ps.expense, income: ps.income,
    });
  }

  root.innerHTML = `
    <header class="screen-head">
      <h1>Reports</h1>
      <div class="period-nav">
        <button class="link" id="prev" type="button" aria-label="Previous period">&larr;</button>
        <span>${esc(periodLabel(start, startDay))}</span>
        <button class="link" id="next" type="button" aria-label="Next period" ${repState.offset === 0 ? 'disabled' : ''}>&rarr;</button>
      </div>
    </header>

    <section class="stat-grid">
      <div class="card stat"><span class="muted">Spent</span><strong class="bad">${fmtMoney(s.expense, cur)}</strong></div>
      <div class="card stat"><span class="muted">Income</span><strong class="ok">${fmtMoney(s.income, cur)}</strong></div>
      <div class="card stat"><span class="muted">Net</span><strong class="${net >= 0 ? 'ok' : 'bad'}">${net >= 0 ? '+' : ''}${fmtMoney(net, cur)}</strong></div>
    </section>

    <section class="card">
      <h2 class="card-title">Spending pace</h2>
      <div id="chart-pace"></div>
    </section>

    <section class="card">
      <h2 class="card-title">By category</h2>
      <div id="chart-cats"></div>
    </section>

    <section class="card">
      <h2 class="card-title">Last 6 periods</h2>
      <div id="chart-months"></div>
    </section>`;

  $('#prev', root).addEventListener('click', () => { repState.offset--; ctx.refresh(); });
  $('#next', root).addEventListener('click', () => { if (repState.offset < 0) { repState.offset++; ctx.refresh(); } });

  charts.paceLine($('#chart-pace', root), { points, paceTo: repState.offset === 0 ? totalBudget() : 0, currency: cur });
  charts.bars($('#chart-cats', root), catData, { currency: cur });
  charts.compareBars($('#chart-months', root), months, { currency: cur });
}
