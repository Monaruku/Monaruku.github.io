// Onboarding wizard + Settings screen (incl. Shortcut Builder and Backup).

import {
  state, saveSettings, setOnboarded, saveCategory, archiveCategory,
  addTemplate, removeTemplate, addRecurring, updateRecurring, removeRecurring, catchUpRecurring,
  buildExport, buildCSV, importData, validateImport, markExported, daysSinceExport,
  categoryById, BUDGET_PRESETS, computeBudgetPlan, applyBudgetPlan,
} from './store.js';
import { $, $$, esc, fmtMoney, parseAmount, toast } from './util.js';

const CURRENCIES = ['MYR', 'SGD', 'USD', 'EUR', 'GBP', 'JPY', 'IDR', 'THB', 'PHP'];

function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}

// --- Onboarding ---------------------------------------------------------------

export function renderOnboarding(root, ctx) {
  const ob = { step: 0, currency: 'MYR', monthStartDay: 1 };

  function render() {
    const steps = ['Currency', 'Month start', 'Budgets', 'Install'];
    let body = '';

    if (ob.step === 0) {
      body = `
        <h1>Welcome to Budget</h1>
        <p class="muted">Private, offline expense tracking. First — your currency:</p>
        <label class="field">
          <span>Currency</span>
          <select id="ob-currency">
            ${CURRENCIES.map(c => `<option value="${c}" ${c === ob.currency ? 'selected' : ''}>${c}${c === 'MYR' ? ' (RM)' : ''}</option>`).join('')}
          </select>
        </label>`;
    } else if (ob.step === 1) {
      body = `
        <h1>Month start day</h1>
        <p class="muted">When does your budget month begin? (Payday is a good choice.)</p>
        <label class="field">
          <span>Day of month</span>
          <select id="ob-day">
            ${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${i + 1 === ob.monthStartDay ? 'selected' : ''}>${i + 1}</option>`).join('')}
          </select>
        </label>`;
    } else if (ob.step === 2) {
      body = `
        <h1>Monthly budgets</h1>
        <p class="muted">Set a ceiling per category — you can change these anytime.</p>
        ${state.categories.filter(c => !c.archived).map(c => `
          <label class="field budget-field">
            <span>${c.icon} ${esc(c.name)}</span>
            <input type="text" inputmode="decimal" data-budget="${esc(c.id)}"
                   value="${(c.monthlyBudgetCents / 100).toFixed(0)}">
          </label>`).join('')}
        <button class="link" id="ob-skip" type="button">Skip for now</button>`;
    } else {
      body = `
        <h1>Install on your iPhone</h1>
        ${isIOS() && !isStandalone() ? `
          <ol class="steps">
            <li>Tap the <strong>Share</strong> button in Safari <span aria-hidden="true">⎋</span></li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> — done. It runs full-screen and offline.</li>
          </ol>
          <p class="muted">Install first, then set up Shortcuts — iOS keeps the installed app's data separate from Safari tabs.</p>
          <p class="muted">Find Shortcut recipes later under Settings → Shortcut Builder.</p>`
        : `<p class="muted">You're all set. Tip: Settings → Shortcut Builder shows how to log expenses from Siri or bank SMS.</p>`}`;
    }

    root.innerHTML = `
      <div class="onboarding">
        <div class="ob-dots">${steps.map((s, i) => `<span class="dot ${i === ob.step ? 'active' : ''}" aria-label="${esc(s)}"></span>`).join('')}</div>
        ${body}
        <button class="btn primary block" id="ob-next" type="button">
          ${ob.step === steps.length - 1 ? 'Start budgeting' : 'Continue'}
        </button>
      </div>`;

    $('#ob-next', root).addEventListener('click', async () => {
      if (ob.step === 0) {
        ob.currency = $('#ob-currency', root).value;
      } else if (ob.step === 1) {
        ob.monthStartDay = parseInt($('#ob-day', root).value, 10);
      } else if (ob.step === 2) {
        for (const input of $$('[data-budget]', root)) {
          const cents = parseAmount(input.value);
          if (cents != null) await saveCategory({ id: input.dataset.budget, monthlyBudgetCents: cents });
        }
      } else {
        await saveSettings({ currency: ob.currency, monthStartDay: ob.monthStartDay });
        await setOnboarded();
        location.hash = '#/';
        ctx.refresh();
        return;
      }
      ob.step++;
      render();
    });

    const skip = $('#ob-skip', root);
    if (skip) skip.addEventListener('click', () => { ob.step++; render(); });
  }

  render();
}

// --- Backup helpers -------------------------------------------------------------

function stamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

async function exportFile(filename, text, mime) {
  const file = new File([text], filename, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Budget backup' });
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return false; // user cancelled the sheet
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function confirmImportModal(json) {
  return new Promise(resolve => {
    const txCount = json.transactions.filter(t => !t.deletedAt).length;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Import backup">
        <h2>Import backup</h2>
        <p class="muted">${txCount} transactions, ${json.categories.length} categories
          · exported ${esc(new Date(json.exportedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }))}</p>
        <button class="btn primary block" data-mode="merge" type="button">Merge with current data</button>
        <button class="btn danger block" data-mode="replace" type="button">Replace everything</button>
        <button class="btn ghost block" data-mode="" type="button">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { overlay.remove(); resolve(null); return; }
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      overlay.remove();
      resolve(btn.dataset.mode || null);
    });
  });
}

// --- Settings -------------------------------------------------------------------

export function renderSettings(root, params, ctx) {
  const cur = state.settings.currency;
  const dse = daysSinceExport();
  const version = document.querySelector('meta[name="budget-version"]')?.content || 'dev';
  const cats = state.categories.filter(c => !c.archived);

  const builderUrl = buildShortcutUrl();

  root.innerHTML = `
    <header class="screen-head"><h1>Settings</h1></header>

    <section class="card">
      <h2 class="card-title">General</h2>
      <label class="field">
        <span>Currency</span>
        <select id="s-currency">
          ${CURRENCIES.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>${c}${c === 'MYR' ? ' (RM)' : ''}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>Month start day</span>
        <select id="s-day">
          ${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${i + 1 === state.settings.monthStartDay ? 'selected' : ''}>${i + 1}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>App badge (installed app)</span>
        <select id="s-badge">
          <option value="off" ${state.settings.badgeMode === 'off' ? 'selected' : ''}>Off</option>
          <option value="backup" ${state.settings.badgeMode === 'backup' ? 'selected' : ''}>Days since last backup</option>
          <option value="overspend" ${state.settings.badgeMode === 'overspend' ? 'selected' : ''}>Over-budget categories</option>
        </select>
      </label>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">Categories &amp; budgets</h2>
        <button class="link" id="open-calc" type="button">Calculate from salary</button>
      </div>
      ${cats.map(c => `
        <div class="cat-row" data-cat-row="${esc(c.id)}">
          <input type="color" class="cat-color" value="${esc(c.color)}" data-cat-color="${esc(c.id)}" aria-label="${esc(c.name)} color">
          <span class="cat-name">${c.icon} ${esc(c.name)}</span>
          <input type="text" inputmode="decimal" class="cat-budget" value="${(c.monthlyBudgetCents / 100).toFixed(0)}"
                 data-cat-budget="${esc(c.id)}" aria-label="${esc(c.name)} monthly budget">
          <button class="icon-btn" data-cat-archive="${esc(c.id)}" type="button" aria-label="Archive ${esc(c.name)}">&#10005;</button>
        </div>`).join('')}
      <div class="add-row">
        <input type="text" id="new-cat" placeholder="New category name" maxlength="24">
        <button class="btn ghost" id="add-cat" type="button">Add</button>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Quick-add templates</h2>
      ${state.templates.length ? state.templates.map(t => `
        <div class="cat-row">
          <span class="cat-name">${esc(t.label)}</span>
          <span class="muted">${fmtMoney(t.amountCents, cur)} · ${esc(categoryById(t.categoryId).name)}</span>
          <button class="icon-btn" data-tpl-del="${esc(t.id)}" type="button" aria-label="Delete template">&#10005;</button>
        </div>`).join('') : '<p class="muted">None yet — tick "Save as quick-add template" when adding a transaction.</p>'}
    </section>

    <section class="card">
      <h2 class="card-title">Recurring</h2>
      ${state.recurring.length ? state.recurring.map(r => `
        <div class="cat-row">
          <label class="check"><input type="checkbox" data-rec-toggle="${esc(r.id)}" ${r.active ? 'checked' : ''}>
            <span>${esc(r.note || categoryById(r.categoryId).name)} · ${fmtMoney(r.amountCents, cur)} · day ${r.dayOfMonth}</span></label>
          <button class="icon-btn" data-rec-del="${esc(r.id)}" type="button" aria-label="Delete recurring rule">&#10005;</button>
        </div>`).join('') : '<p class="muted">Rent, subscriptions… auto-logged on the day you pick.</p>'}
      <div class="add-row wrap">
        <select id="rec-cat">${cats.map(c => `<option value="${esc(c.id)}">${c.icon} ${esc(c.name)}</option>`).join('')}</select>
        <input type="text" inputmode="decimal" id="rec-amount" placeholder="Amount" aria-label="Recurring amount">
        <input type="number" id="rec-day" min="1" max="28" placeholder="Day" aria-label="Day of month">
        <input type="text" id="rec-note" placeholder="Note (e.g. Rent)" maxlength="40">
        <button class="btn ghost" id="rec-add" type="button">Add</button>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Shortcut Builder</h2>
      <p class="muted">Build a URL, paste it into a Shortcut's "Open URL" action, and log expenses from Siri, automations, or bank SMS.</p>
      <div class="add-row wrap">
        <select id="sb-cat">${cats.map(c => `<option value="${esc(c.id)}">${c.icon} ${esc(c.name)}</option>`).join('')}</select>
        <input type="text" inputmode="decimal" id="sb-amount" placeholder="Amount (blank = ask)">
        <input type="text" id="sb-note" placeholder="Note (optional)" maxlength="40">
      </div>
      <label class="field">
        <span>Link type</span>
        <select id="sb-format">
          <option value="webapp">Direct to app (webapp:// · iOS 26+)</option>
          <option value="https">Universal (https://)</option>
        </select>
      </label>
      <label class="check"><input type="checkbox" id="sb-autosave" checked>
        <span>Autosave (no tap needed; adds <code>uid</code> for duplicate protection)</span></label>
      <textarea class="url-out" id="sb-out" readonly rows="3">${esc(builderUrl)}</textarea>
      <button class="btn primary" id="sb-copy" type="button">Copy URL</button>
      <ol class="steps">
        <li>In Shortcuts: new shortcut → Add Action → Web → <strong>Open URLs</strong> (or <strong>Open X-Callback URL</strong> to chain actions after saving).</li>
        <li>Paste the URL. If autosave is on, tap the word <code>UUID</code> and replace it with the <strong>UUID</strong> variable so retries never double-log.</li>
        <li>For automations, enable <strong>Run Immediately</strong> (iOS 15.4+).</li>
      </ol>
    </section>

    <section class="card">
      <h2 class="card-title">Backup &amp; data</h2>
      <p class="muted">Last backup: ${dse === null ? 'never' : dse === 0 ? 'today' : `${dse} day${dse === 1 ? '' : 's'} ago`}</p>
      <p class="muted" id="storage-status"></p>
      <div class="btn-row">
        <button class="btn primary" id="exp-json" type="button">Export JSON</button>
        <button class="btn ghost" id="exp-csv" type="button">Export CSV</button>
      </div>
      <label class="btn ghost block file-label">
        Import backup (JSON)
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </label>
    </section>

    <section class="card">
      <h2 class="card-title">About</h2>
      <p class="muted">Build ${esc(version)} · All data stays on this device (IndexedDB). No account, no server, no tracking.</p>
      <button class="btn ghost block" id="check-updates" type="button">Check for updates</button>
      ${isIOS() && !isStandalone() ? '<p class="muted">Tip: Share → Add to Home Screen for full-screen offline use.</p>' : ''}
      <a class="link" href="/">← Back to portal</a>
    </section>`;

  bindSettings(root, ctx);
}

// --- Salary budget calculator -----------------------------------------------------

function openSalaryCalc(ctx) {
  const cur = state.settings.currency;
  let salaryCents = null;
  let preset = 'balanced';
  let rows = [];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Budget calculator">
      <h2>Calculate from salary</h2>
      <p class="muted">Enter your net monthly salary, pick a split, then fine-tune any row before applying.</p>
      <label class="field">
        <span>Net monthly salary (${esc(cur)})</span>
        <input type="text" inputmode="decimal" id="calc-salary" placeholder="e.g. 4500" autocomplete="off">
      </label>
      <div class="chips" id="calc-presets">
        ${Object.entries(BUDGET_PRESETS).map(([key, p]) =>
          `<button class="chip ${key === preset ? 'active' : ''}" data-preset="${key}" type="button">${esc(p.label)}</button>`).join('')}
        <button class="chip" data-preset="custom" type="button">Custom</button>
      </div>
      <div class="calc-rows" id="calc-rows"></div>
      <p class="calc-total" id="calc-total"></p>
      <p class="muted tiny">Needs = food, transport, bills · Wants = lifestyle · Salaried? Your EPF contribution already covers part of the savings slice.</p>
      <button class="btn primary block" id="calc-apply" type="button" disabled>Apply budgets</button>
      <button class="btn ghost block" id="calc-cancel" type="button">Cancel</button>
    </div>`;
  document.body.appendChild(overlay);

  const salaryInput = $('#calc-salary', overlay);
  const rowsEl = $('#calc-rows', overlay);
  const totalEl = $('#calc-total', overlay);
  const applyBtn = $('#calc-apply', overlay);

  function renderRows() {
    rowsEl.innerHTML = rows.map(r => `
      <div class="calc-row" data-row="${esc(r.id)}">
        <span class="calc-name">${r.icon} ${esc(r.name)} <span class="bucket-tag">${esc(r.bucket)}</span></span>
        <input inputmode="decimal" class="calc-pct" data-pct="${esc(r.id)}" value="${r.pct ? String(r.pct.toFixed(1)).replace(/\.0$/, '') : ''}" placeholder="%" aria-label="${esc(r.name)} percentage">
        <input inputmode="decimal" class="calc-amt" data-amt="${esc(r.id)}" value="${r.cents ? (r.cents / 100).toString() : ''}" placeholder="RM" aria-label="${esc(r.name)} monthly budget">
      </div>`).join('');
    renderTotal();
  }

  function renderTotal() {
    const allocated = rows.reduce((s, r) => s + (r.cents || 0), 0);
    if (!salaryCents) {
      totalEl.textContent = '';
      totalEl.classList.remove('over');
      applyBtn.disabled = true;
      return;
    }
    const diff = salaryCents - allocated;
    const pct = (allocated / salaryCents) * 100;
    totalEl.classList.toggle('over', diff < 0);
    totalEl.textContent = diff < 0
      ? `Allocated ${fmtMoney(allocated, cur)} (${pct.toFixed(0)}%) — exceeds salary by ${fmtMoney(-diff, cur)}`
      : `Allocated ${fmtMoney(allocated, cur)} (${pct.toFixed(0)}%)${diff > 0 ? ` — ${fmtMoney(diff, cur)} unallocated` : ''}`;
    applyBtn.disabled = false;
  }

  function recalc() {
    rows = computeBudgetPlan(salaryCents || 0, preset === 'custom' ? null : preset);
    renderRows();
  }

  salaryInput.addEventListener('input', () => {
    salaryCents = parseAmount(salaryInput.value);
    if (preset === 'custom') {
      // Custom mode: keep the user's percentages, rescale amounts to the salary.
      rows.forEach(r => {
        r.cents = salaryCents ? Math.round(((salaryCents * (r.pct || 0)) / 100) / 100) * 100 : 0;
      });
      renderRows();
    } else {
      recalc();
    }
  });

  $('#calc-presets', overlay).addEventListener('click', e => {
    const btn = e.target.closest('[data-preset]');
    if (!btn) return;
    preset = btn.dataset.preset;
    $$('#calc-presets .chip', overlay).forEach(c => c.classList.toggle('active', c === btn));
    recalc();
  });

  // Two-way % ↔ RM editing; any manual edit switches the split to Custom.
  rowsEl.addEventListener('input', e => {
    const pctInput = e.target.closest('[data-pct]');
    const amtInput = e.target.closest('[data-amt]');
    if (!pctInput && !amtInput) return;
    preset = 'custom';
    $$('#calc-presets .chip', overlay).forEach(c => c.classList.toggle('active', c.dataset.preset === 'custom'));
    const id = pctInput ? pctInput.dataset.pct : amtInput.dataset.amt;
    const row = rows.find(r => r.id === id);
    if (!row) return;
    if (pctInput) {
      const pct = parseFloat(pctInput.value.replace(',', '.'));
      row.pct = isNaN(pct) ? 0 : pct;
      row.cents = salaryCents ? Math.round(((salaryCents * row.pct) / 100) / 100) * 100 : 0;
      const amt = rowsEl.querySelector(`[data-amt="${id}"]`);
      if (amt) amt.value = row.cents ? (row.cents / 100).toString() : '';
    } else {
      row.cents = parseAmount(amtInput.value) || 0;
      row.pct = salaryCents ? (row.cents / salaryCents) * 100 : 0;
      const pctEl = rowsEl.querySelector(`[data-pct="${id}"]`);
      if (pctEl) pctEl.value = salaryCents && row.cents ? String(row.pct.toFixed(1)).replace(/\.0$/, '') : '';
    }
    renderTotal();
  });

  applyBtn.addEventListener('click', async () => {
    await applyBudgetPlan(rows);
    overlay.remove();
    toast('Budgets updated');
    ctx.refresh();
  });
  $('#calc-cancel', overlay).addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  recalc();
}

function buildShortcutUrl() {
  const cat = document.getElementById('sb-cat')?.value || 'food';
  const amount = document.getElementById('sb-amount')?.value.trim();
  const note = document.getElementById('sb-note')?.value.trim();
  const autosave = document.getElementById('sb-autosave')?.checked ?? true;
  const format = document.getElementById('sb-format')?.value || 'webapp';
  const p = new URLSearchParams();
  p.set('category', cat);
  if (amount) p.set('amount', amount);
  if (note) p.set('note', note);
  if (autosave) { p.set('autosave', '1'); p.set('uid', 'UUID'); }
  // webapp:// (iOS 26+) opens the installed Home Screen app directly;
  // https:// relies on Safari-default-browser link capture.
  const base = format === 'webapp'
    ? 'webapp://monaruku.github.io/budget/'
    : 'https://monaruku.github.io/budget/';
  return `${base}#/add?${p.toString()}`;
}

function bindSettings(root, ctx) {
  $('#s-currency', root).addEventListener('change', e => saveSettings({ currency: e.target.value }).then(ctx.refresh));
  $('#s-day', root).addEventListener('change', e => saveSettings({ monthStartDay: parseInt(e.target.value, 10) }).then(ctx.refresh));
  $('#s-badge', root).addEventListener('change', e => saveSettings({ badgeMode: e.target.value }).then(ctx.refresh));

  // Property assignment (not addEventListener): #app is persistent, so listeners
  // attached with addEventListener would accumulate on every re-render and
  // multi-fire every action (this caused quadruple category creation).
  root.onchange = async e => {
    const budgetInput = e.target.closest('[data-cat-budget]');
    if (budgetInput) {
      const cents = parseAmount(budgetInput.value) || 0;
      await saveCategory({ id: budgetInput.dataset.catBudget, monthlyBudgetCents: cents });
      toast('Budget updated');
      return;
    }
    const colorInput = e.target.closest('[data-cat-color]');
    if (colorInput) {
      await saveCategory({ id: colorInput.dataset.catColor, color: colorInput.value });
      return;
    }
    const recToggle = e.target.closest('[data-rec-toggle]');
    if (recToggle) {
      await updateRecurring(recToggle.dataset.recToggle, { active: recToggle.checked });
      await catchUpRecurring();
      ctx.refresh();
    }
  };

  root.onclick = async e => {
    if (e.target.closest('#check-updates')) {
      document.dispatchEvent(new CustomEvent('budget:check-updates'));
      return;
    }

    if (e.target.closest('#open-calc')) { openSalaryCalc(ctx); return; }

    const archive = e.target.closest('[data-cat-archive]');
    if (archive) { await archiveCategory(archive.dataset.catArchive); ctx.refresh(); return; }

    const tplDel = e.target.closest('[data-tpl-del]');
    if (tplDel) { await removeTemplate(tplDel.dataset.tplDel); ctx.refresh(); return; }

    const recDel = e.target.closest('[data-rec-del]');
    if (recDel) { await removeRecurring(recDel.dataset.recDel); ctx.refresh(); return; }

    if (e.target.closest('#add-cat')) {
      const input = $('#new-cat', root);
      const name = input.value.trim();
      if (!name) return;
      await saveCategory({ name });
      toast(`Category "${name}" added`);
      ctx.refresh();
      return;
    }

    if (e.target.closest('#rec-add')) {
      const cents = parseAmount($('#rec-amount', root).value);
      const day = parseInt($('#rec-day', root).value, 10);
      if (!cents || cents <= 0) { toast('Enter an amount'); return; }
      if (!day || day < 1 || day > 28) { toast('Day must be 1–28'); return; }
      await addRecurring({
        type: 'expense', amountCents: cents, dayOfMonth: day,
        categoryId: $('#rec-cat', root).value, note: $('#rec-note', root).value.trim(),
      });
      await catchUpRecurring();
      toast('Recurring rule added');
      ctx.refresh();
      return;
    }

    if (e.target.closest('#sb-copy')) {
      const out = $('#sb-out', root);
      try {
        await navigator.clipboard.writeText(out.value);
        toast('Copied — paste it into your Shortcut');
      } catch {
        out.select();
        document.execCommand('copy');
        toast('Copied — paste it into your Shortcut');
      }
      return;
    }

    if (e.target.closest('#exp-json')) {
      const ok = await exportFile(`budget-backup-${stamp()}.json`, JSON.stringify(buildExport(), null, 2), 'application/json');
      if (ok) { await markExported(); toast('Backup exported'); ctx.refresh(); }
      return;
    }

    if (e.target.closest('#exp-csv')) {
      await exportFile(`budget-transactions-${stamp()}.csv`, buildCSV(), 'text/csv');
      // CSV is transactions-only, so it does not count as a full backup.
      return;
    }
  };

  // Shortcut Builder live URL updates.
  ['sb-cat', 'sb-amount', 'sb-note', 'sb-autosave', 'sb-format'].forEach(id => {
    const el = $('#' + id, root);
    if (el) {
      el.addEventListener('input', () => { $('#sb-out', root).value = buildShortcutUrl(); });
      el.addEventListener('change', () => { $('#sb-out', root).value = buildShortcutUrl(); });
    }
  });

  // Import flow.
  $('#import-file', root).addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let json;
    try {
      json = JSON.parse(await file.text());
      validateImport(json);
    } catch (err) {
      toast(err.message || 'Could not read that file.');
      return;
    }
    const mode = await confirmImportModal(json);
    if (!mode) return;
    await importData(json, mode);
    toast(mode === 'replace' ? 'Backup restored' : 'Backup merged');
    ctx.refresh();
  });

  // Storage persistence status.
  const status = $('#storage-status', root);
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(persisted => {
      status.textContent = persisted
        ? 'Storage: persistent — iOS will not auto-clear your data.'
        : 'Storage: best-effort — iOS may clear data under pressure, so export regularly.';
    }).catch(() => {});
  }
}
