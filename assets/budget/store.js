// Data layer: in-memory state backed by the IndexedDB key-value store.
// Collections are stored whole under single keys (fine for thousands of rows).

import * as kv from './kv.js';
import { uid, slugify, todayISO, toISODate, daysInMonth, periodFor } from './util.js';

export const SCHEMA_VERSION = 1;

const DEFAULT_CATEGORIES = [
  { id: 'food',          name: 'Food',          monthlyBudgetCents: 60000, color: '#f59e0b', icon: '🍜', archived: false },
  { id: 'transport',     name: 'Transport',     monthlyBudgetCents: 20000, color: '#38bdf8', icon: '🚗', archived: false },
  { id: 'bills',         name: 'Bills',         monthlyBudgetCents: 50000, color: '#a78bfa', icon: '🧾', archived: false },
  { id: 'entertainment', name: 'Entertainment', monthlyBudgetCents: 20000, color: '#f472b6', icon: '🎮', archived: false },
  { id: 'other',         name: 'Other',         monthlyBudgetCents: 10000, color: '#94a3b8', icon: '📦', archived: false },
];

const DEFAULT_SETTINGS = { currency: 'MYR', monthStartDay: 1, theme: 'dark', badgeMode: 'off' };
const DEFAULT_META = { schemaVersion: SCHEMA_VERSION, lastExportAt: null, processedUids: [], onboarded: false };
const COLLECTIONS = ['transactions', 'categories', 'settings', 'templates', 'recurring', 'meta'];

export const state = {
  transactions: [],
  categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
  settings: { ...DEFAULT_SETTINGS },
  templates: [],
  recurring: [],
  meta: { ...DEFAULT_META },
};

export async function initStore() {
  const [tx, cats, settings, templates, recurring, meta] = await Promise.all(COLLECTIONS.map(k => kv.get(k)));
  state.transactions = Array.isArray(tx) ? tx : [];
  if (Array.isArray(cats) && cats.length) state.categories = cats;
  if (!Array.isArray(cats)) await kv.set('categories', state.categories);
  state.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  state.templates = Array.isArray(templates) ? templates : [];
  state.recurring = Array.isArray(recurring) ? recurring : [];
  state.meta = { ...DEFAULT_META, ...(meta || {}) };
}

const persist = key => kv.set(key, state[key]);
const notify = () => document.dispatchEvent(new CustomEvent('budget:data'));

// --- Lookups ----------------------------------------------------------------

export function categoryById(id) {
  return state.categories.find(c => c.id === id) || state.categories.find(c => c.id === 'other');
}

// Deep links reference categories by case-insensitive slug or name.
export function categoryBySlug(slug) {
  const s = String(slug || '').toLowerCase();
  return state.categories.find(c => c.id === s || c.name.toLowerCase() === s) || categoryById('other');
}

export function totalBudget() {
  return state.categories.filter(c => !c.archived).reduce((sum, c) => sum + (c.monthlyBudgetCents || 0), 0);
}

// --- Salary-based budget allocation --------------------------------------------

// Categories without an explicit bucket fall back to this map, then 'wants'.
const BUCKET_OF = {
  food: 'needs', transport: 'needs', bills: 'needs',
  entertainment: 'wants', other: 'wants', savings: 'savings',
};

export function bucketFor(cat) {
  return cat.bucket || BUCKET_OF[cat.id] || 'wants';
}

export const BUDGET_PRESETS = {
  balanced:   { label: 'Balanced 50/30/20',   buckets: { needs: 50, wants: 30, savings: 20 } },
  essentials: { label: 'Essentials 60/20/20', buckets: { needs: 60, wants: 20, savings: 20 } },
  saver:      { label: 'Saver 40/30/30',      buckets: { needs: 40, wants: 30, savings: 30 } },
};

// Active categories plus a synthetic Savings row (created on apply when funded).
export function planCategories() {
  const rows = state.categories
    .filter(c => !c.archived)
    .map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, bucket: bucketFor(c), current: c.monthlyBudgetCents || 0 }));
  if (!rows.some(r => r.bucket === 'savings')) {
    rows.push({ id: 'savings', name: 'Savings', icon: '🏦', color: '#34d399', bucket: 'savings', current: 0 });
  }
  return rows;
}

// Distribute a salary across categories: each bucket gets its preset pool, split
// within the bucket by current budget proportions (equal when the bucket is
// all-zero), rounded to whole RM with rounding drift absorbed by the largest row.
export function computeBudgetPlan(salaryCents, presetKey) {
  const preset = BUDGET_PRESETS[presetKey];
  const rows = planCategories();
  if (!preset || !(salaryCents > 0)) {
    // Custom / no-salary baseline: current budgets.
    return rows.map(r => ({ ...r, cents: r.current, pct: salaryCents > 0 ? (r.current / salaryCents) * 100 : 0 }));
  }
  const out = [];
  for (const bucket of ['needs', 'wants', 'savings']) {
    const pool = Math.round((salaryCents * preset.buckets[bucket]) / 100);
    const members = rows.filter(r => r.bucket === bucket);
    if (!members.length) continue;
    const currentTotal = members.reduce((s, r) => s + r.current, 0);
    for (const r of members) {
      const share = currentTotal > 0 ? (pool * r.current) / currentTotal : pool / members.length;
      out.push({ ...r, cents: Math.round(share / 100) * 100 });
    }
  }
  const target = Math.round((salaryCents * (preset.buckets.needs + preset.buckets.wants + preset.buckets.savings)) / 100);
  const drift = target - out.reduce((s, r) => s + r.cents, 0);
  if (drift !== 0 && out.length) {
    const largest = out.reduce((a, b) => (b.cents > a.cents ? b : a));
    largest.cents = Math.max(0, largest.cents + drift);
  }
  return out.map(r => ({ ...r, pct: salaryCents > 0 ? (r.cents / salaryCents) * 100 : 0 }));
}

// Apply a plan atomically: mutate all category budgets, persist once.
export async function applyBudgetPlan(rows) {
  for (const r of rows) {
    const existing = state.categories.find(c => c.id === r.id);
    if (existing) {
      existing.monthlyBudgetCents = r.cents;
      existing.archived = false;
      if (r.bucket) existing.bucket = r.bucket;
    } else if (r.cents > 0) {
      state.categories.push({
        id: r.id, name: r.name, icon: r.icon || '🏦', color: r.color || '#34d399',
        monthlyBudgetCents: r.cents, archived: false, bucket: r.bucket,
      });
    }
  }
  await persist('categories');
  notify();
}

// --- Transactions -----------------------------------------------------------

export async function addTransaction({ type = 'expense', amountCents, categoryId = 'other', note = '', date, source = 'manual', id }) {
  const now = new Date().toISOString();
  const rec = {
    id: id || uid(),
    type: type === 'income' ? 'income' : 'expense',
    amountCents,
    categoryId,
    note: String(note || '').trim(),
    date: date || todayISO(),
    source,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  state.transactions.unshift(rec);
  await persist('transactions');
  notify();
  return rec;
}

export async function softDeleteTransaction(id) {
  const t = state.transactions.find(x => x.id === id);
  if (!t) return null;
  const now = new Date().toISOString();
  t.deletedAt = now;
  t.updatedAt = now;
  await persist('transactions');
  notify();
  return t;
}

export async function restoreTransaction(id) {
  const t = state.transactions.find(x => x.id === id);
  if (!t) return;
  t.deletedAt = null;
  t.updatedAt = new Date().toISOString();
  await persist('transactions');
  notify();
}

// Permanently drop soft-deleted rows older than 30 days. Runs on boot.
export async function purgeDeleted() {
  const cutoff = Date.now() - 30 * 86400000;
  const before = state.transactions.length;
  state.transactions = state.transactions.filter(t => !t.deletedAt || Date.parse(t.deletedAt) > cutoff);
  if (state.transactions.length !== before) await persist('transactions');
}

// --- Settings / categories / templates / recurring --------------------------

export async function saveSettings(patch) {
  Object.assign(state.settings, patch);
  await persist('settings');
  notify();
}

export async function setOnboarded() {
  state.meta.onboarded = true;
  await persist('meta');
}

export async function saveCategory(cat) {
  if (cat.id) {
    const existing = state.categories.find(c => c.id === cat.id);
    if (existing) Object.assign(existing, cat);
  } else {
    let id = slugify(cat.name);
    while (state.categories.some(c => c.id === id)) id += '-' + uid().slice(0, 4);
    state.categories.push({ color: '#34d399', icon: '💸', archived: false, monthlyBudgetCents: 0, ...cat, id });
  }
  await persist('categories');
  notify();
}

export async function archiveCategory(id) {
  const c = categoryById(id);
  if (c) { c.archived = true; await persist('categories'); notify(); }
}

export async function addTemplate(t) {
  state.templates.push({ id: uid(), type: 'expense', note: '', ...t });
  await persist('templates');
}

export async function removeTemplate(id) {
  state.templates = state.templates.filter(t => t.id !== id);
  await persist('templates');
}

export async function addRecurring(rule) {
  state.recurring.push({ id: uid(), active: true, note: '', lastGeneratedMonth: null, ...rule });
  await persist('recurring');
}

export async function updateRecurring(id, patch) {
  const r = state.recurring.find(x => x.id === id);
  if (r) { Object.assign(r, patch); await persist('recurring'); }
}

export async function removeRecurring(id) {
  state.recurring = state.recurring.filter(r => r.id !== id);
  await persist('recurring');
}

// Insert due occurrences for active rules; deterministic ids make re-runs safe.
export async function catchUpRecurring() {
  const startDay = state.settings.monthStartDay;
  const now = new Date();
  const currentStart = periodFor(null, startDay).start;
  let added = false;

  for (const rule of state.recurring) {
    if (!rule.active) continue;
    let cursor;
    if (rule.lastGeneratedMonth) {
      const last = new Date(rule.lastGeneratedMonth + 'T00:00:00');
      cursor = new Date(last.getFullYear(), last.getMonth() + 1, startDay);
    } else {
      cursor = currentStart;
    }
    while (cursor <= currentStart) {
      const key = toISODate(cursor);
      const id = `rec_${rule.id}_${key}`;
      const due = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(rule.dayOfMonth, daysInMonth(cursor)));
      if (due <= now && !state.transactions.some(t => t.id === id)) {
        const ts = new Date().toISOString();
        state.transactions.unshift({
          id, type: rule.type, amountCents: rule.amountCents, categoryId: rule.categoryId,
          note: rule.note || '', date: toISODate(due), source: 'recurring',
          createdAt: ts, updatedAt: ts, deletedAt: null,
        });
        added = true;
      }
      rule.lastGeneratedMonth = key;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, startDay);
    }
  }
  if (added) { await persist('transactions'); notify(); }
  await persist('recurring');
}

// --- Dedupe (Shortcut autosave) ----------------------------------------------

export function isUidProcessed(u) {
  return !!u && state.meta.processedUids.some(p => p.uid === u);
}

export async function recordUid(u) {
  const cutoff = Date.now() - 90 * 86400000;
  state.meta.processedUids = state.meta.processedUids.filter(p => p.at > cutoff);
  state.meta.processedUids.push({ uid: u, at: Date.now() });
  state.meta.processedUids = state.meta.processedUids.slice(-500);
  await persist('meta');
}

// --- Summaries ----------------------------------------------------------------

export function periodTransactions(start, end) {
  const s = toISODate(start), e = toISODate(end);
  return state.transactions.filter(t => !t.deletedAt && t.date >= s && t.date < e);
}

export function summarize(start, end) {
  const tx = periodTransactions(start, end);
  const byCat = {};
  const daily = {};
  let expense = 0, income = 0;
  for (const t of tx) {
    if (t.type === 'income') {
      income += t.amountCents;
    } else {
      expense += t.amountCents;
      byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amountCents;
      daily[t.date] = (daily[t.date] || 0) + t.amountCents;
    }
  }
  return { tx, byCat, daily, expense, income };
}

// --- Backup --------------------------------------------------------------------

export function daysSinceExport() {
  if (!state.meta.lastExportAt) return null;
  return Math.floor((Date.now() - Date.parse(state.meta.lastExportAt)) / 86400000);
}

export async function markExported() {
  state.meta.lastExportAt = new Date().toISOString();
  await persist('meta');
  notify();
}

export function buildExport() {
  return {
    app: 'monaruku-budget',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    categories: state.categories,
    transactions: state.transactions,
    templates: state.templates,
    recurring: state.recurring,
  };
}

export function buildCSV() {
  const quote = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['date', 'type', 'category', 'amount', 'note', 'source'].join(',')];
  for (const t of state.transactions.filter(t => !t.deletedAt)) {
    rows.push([
      t.date, t.type, quote(categoryById(t.categoryId)?.name || t.categoryId),
      (t.amountCents / 100).toFixed(2), quote(t.note), t.source,
    ].join(','));
  }
  return rows.join('\r\n');
}

export function validateImport(json) {
  if (!json || typeof json !== 'object') throw new Error('That file is not valid JSON.');
  if (json.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported backup version (${json.schemaVersion ?? 'unknown'}).`);
  }
  if (!Array.isArray(json.transactions) || !Array.isArray(json.categories)) {
    throw new Error('Backup is missing transactions or categories.');
  }
  return true;
}

function mergeById(local, incoming) {
  const map = new Map(local.map(r => [r.id, r]));
  for (const r of incoming || []) {
    if (!r || !r.id) continue;
    const ex = map.get(r.id);
    if (!ex || String(r.updatedAt || '') >= String(ex.updatedAt || '')) map.set(r.id, r);
  }
  return [...map.values()];
}

export async function importData(json, mode) {
  validateImport(json);
  if (mode === 'replace') {
    state.transactions = json.transactions;
    state.categories = json.categories;
    state.settings = { ...DEFAULT_SETTINGS, ...(json.settings || {}) };
    state.templates = json.templates || [];
    state.recurring = json.recurring || [];
  } else {
    // Merge: id-keyed, updatedAt wins. Local settings are kept.
    state.transactions = mergeById(state.transactions, json.transactions);
    state.categories = mergeById(state.categories, json.categories);
    state.templates = mergeById(state.templates, json.templates);
    state.recurring = mergeById(state.recurring, json.recurring);
  }
  await Promise.all(['transactions', 'categories', 'settings', 'templates', 'recurring'].map(persist));
  notify();
}
