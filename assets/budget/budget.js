// Entry point: hash router, deep-link/autosave handling, app badge, SW updates.

import {
  initStore, state, purgeDeleted, catchUpRecurring,
  addTransaction, softDeleteTransaction, recordUid, isUidProcessed,
  categoryBySlug, daysSinceExport, summarize, totalBudget,
} from './store.js';
import { parseAmount, fmtMoney, todayISO, periodFor, toast } from './util.js';
import { renderDashboard, renderAdd, renderList, renderReports } from './screens.js';
import { renderOnboarding, renderSettings } from './settings.js';

const root = document.getElementById('app');
const ctx = { refresh: () => route() };

function parseHash() {
  const raw = (location.hash || '#/').slice(1);
  const [pathPart, queryPart] = raw.split('?');
  return { path: (pathPart || '/').replace(/^\/+|\/+$/g, ''), params: new URLSearchParams(queryPart || '') };
}

function setActiveTab(path) {
  const key = path === '' ? 'home' : path;
  document.querySelectorAll('#tabbar a').forEach(a => {
    const active = a.dataset.tab === key;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function route() {
  const { path, params } = parseHash();

  // Autosave deep links run before anything else (even before onboarding).
  if (path === 'add' && params.get('autosave') === '1') {
    await handleAutosave(params);
    return;
  }

  if (!state.meta.onboarded) {
    setActiveTab('');
    renderOnboarding(root, ctx);
    window.scrollTo(0, 0);
    return;
  }

  setActiveTab(path);
  switch (path) {
    case '': case 'dashboard': renderDashboard(root, params, ctx); break;
    case 'add': renderAdd(root, params, ctx); break;
    case 'list': renderList(root, params, ctx); break;
    case 'reports': renderReports(root, params, ctx); break;
    case 'settings': renderSettings(root, params, ctx); break;
    default: renderDashboard(root, params, ctx);
  }
  window.scrollTo(0, 0);
  applyPendingUpdate(); // safe point: any save on this route cleared the draft
}

// --- Deep links ---------------------------------------------------------------

const LAST_AUTO_KEY = 'budget.lastAuto';

async function handleAutosave(params) {
  const cur = state.settings.currency;
  const done = () => {
    const xs = params.get('x-success');
    if (xs) setTimeout(() => { location.href = xs; }, 900);
    else location.hash = '#/?saved=1';
  };
  // Duplicate replays skip the "saved" toast but still honor x-success chaining.
  const doneSilent = () => {
    const xs = params.get('x-success');
    if (xs) setTimeout(() => { location.href = xs; }, 900);
    else location.hash = '#/';
  };
  const fail = () => {
    const xe = params.get('x-error');
    if (xe) { location.href = xe; return; }
    params.delete('autosave');
    location.hash = '#/add?' + params.toString(); // open prefilled editor instead
  };

  const amountCents = parseAmount(params.get('amount'));
  if (amountCents == null || amountCents <= 0) { fail(); return; }

  const uidParam = params.get('uid') || '';
  if (uidParam && isUidProcessed(uidParam)) {
    toast('Already logged (duplicate ignored)');
    doneSilent();
    return;
  }

  // Fallback dedupe for links without uid: identical payload within 60 s.
  const payload = [amountCents, params.get('category') || '', params.get('note') || '', params.get('type') || ''].join('|');
  if (!uidParam) {
    let last = null;
    try { last = JSON.parse(localStorage.getItem(LAST_AUTO_KEY) || 'null'); } catch { /* ignore */ }
    if (last && last.payload === payload && Date.now() - last.at < 60000) {
      toast('Already logged (duplicate ignored)');
      doneSilent();
      return;
    }
  }

  const cat = categoryBySlug(params.get('category'));
  const rec = await addTransaction({
    type: params.get('type') === 'income' ? 'income' : 'expense',
    amountCents,
    categoryId: cat.id,
    note: params.get('note') || '',
    date: params.get('date') || todayISO(),
    source: 'shortcut',
  });

  if (uidParam) await recordUid(uidParam);
  else localStorage.setItem(LAST_AUTO_KEY, JSON.stringify({ payload, at: Date.now() }));

  toast(`Saved ${fmtMoney(amountCents, cur)} to ${cat.name}`, {
    actionLabel: 'Undo',
    onAction: async () => { await softDeleteTransaction(rec.id); route(); },
  });
  done();
}

// --- App badge (iOS 16.4+, installed app only) ----------------------------------

export async function refreshBadge() {
  if (!('setAppBadge' in navigator)) return;
  try {
    const mode = state.settings.badgeMode;
    if (mode === 'backup') {
      const d = daysSinceExport();
      const n = d === null ? 1 : d;
      if (n > 0) await navigator.setAppBadge(Math.min(n, 99));
      else await navigator.clearAppBadge();
    } else if (mode === 'overspend') {
      const { start, end } = periodFor(null, state.settings.monthStartDay);
      const s = summarize(start, end);
      const over = state.categories.filter(c =>
        !c.archived && c.monthlyBudgetCents > 0 && (s.byCat[c.id] || 0) > c.monthlyBudgetCents).length;
      if (over > 0) await navigator.setAppBadge(over);
      else await navigator.clearAppBadge();
    } else {
      await navigator.clearAppBadge();
    }
  } catch { /* badge is a nice-to-have */ }
}

document.addEventListener('budget:data', refreshBadge);

// --- Service worker -------------------------------------------------------------

// --- Service worker -------------------------------------------------------------

let pendingWorker = null;
let updateToastShown = false;

// Apply a waiting update the moment no half-entered transaction draft exists.
function applyPendingUpdate() {
  if (pendingWorker && !localStorage.getItem('budget.draft')) {
    const w = pendingWorker;
    pendingWorker = null;
    w.postMessage('SKIP_WAITING');
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/budget/sw.js').then(reg => {
    const offer = worker => {
      pendingWorker = worker;
      if (localStorage.getItem('budget.draft')) {
        // Defer while drafting — but the prompt must not silently disappear.
        if (updateToastShown) return;
        updateToastShown = true;
        toast('A new version is ready', {
          actionLabel: 'Update now',
          dismissLabel: 'Later',
          sticky: true,
          onAction: () => { const w = pendingWorker; pendingWorker = null; w && w.postMessage('SKIP_WAITING'); },
        });
      } else {
        applyPendingUpdate();
      }
    };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
  }).catch(() => { /* offline-first still works once cached */ });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
}

// --- Boot -----------------------------------------------------------------------

(async function boot() {
  try {
    await initStore();
    await purgeDeleted();
    await catchUpRecurring();
  } catch (err) {
    root.innerHTML = '<p class="muted" style="padding:2rem">Could not open local storage. Please reload.</p>';
    console.error(err);
    return;
  }
  try { await navigator.storage?.persist?.(); } catch { /* optional */ }
  registerSW();
  window.addEventListener('hashchange', route);
  await route();
  refreshBadge();
})();
