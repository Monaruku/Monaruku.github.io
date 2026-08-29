// Shared DOM, money, and date helpers for the budget app.
// Money is always integer minor units (sen for MYR: RM1 = 100 sen).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const fmtCache = new Map();
export function fmtMoney(cents, currency = 'MYR') {
  if (!fmtCache.has(currency)) {
    fmtCache.set(currency, new Intl.NumberFormat('en-MY', { style: 'currency', currency }));
  }
  return fmtCache.get(currency).format((cents || 0) / 100);
}

// Accepts "12.50", "12,50", "RM12.50", 12.5 → integer cents, or null when invalid.
export function parseAmount(input) {
  if (input == null) return null;
  const clean = String(input).trim()
    .replace(/rm\s*/gi, '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

// Evaluate one keypad line like "45÷2" or "100−15" into integer cents.
// '×' and '÷' bind tighter than '−'; trailing operators/dots are tolerated.
// Returns null for anything non-numeric (and for division by zero).
export function evalLine(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/[×÷−.\s]+$/u, '');
  if (!cleaned) return null;
  const terms = cleaned.split('−'); // '+' never appears inside a line (it commits)
  let total = null;
  for (const term of terms) {
    const pieces = term.split(/([×÷])/u);
    let v = parseFloat(pieces[0]);
    if (isNaN(v)) return null;
    for (let i = 1; i + 1 < pieces.length; i += 2) {
      const n = parseFloat(pieces[i + 1]);
      if (isNaN(n)) return null;
      if (pieces[i] === '×') v *= n;
      else { if (n === 0) return null; v /= n; }
    }
    total = total === null ? v : total - v;
  }
  return Math.round(total * 100);
}

export function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) ||
    'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function slugify(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cat';
}

export function toISODate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function todayISO() { return toISODate(new Date()); }

export function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// A budget "month" is anchored on monthStartDay (kept in 1–28 to avoid rollover).
export function periodFor(dateStr, startDay = 1) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  let start = new Date(d.getFullYear(), d.getMonth(), startDay);
  if (d < start) start = new Date(start.getFullYear(), start.getMonth() - 1, startDay);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, startDay);
  return { start, end };
}

export function shiftPeriod(start, startDay, offset) {
  return new Date(start.getFullYear(), start.getMonth() + offset, startDay);
}

export function periodLabel(start, startDay = 1) {
  if (startDay === 1) return start.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const end = new Date(start.getFullYear(), start.getMonth() + 1, startDay);
  const last = new Date(end.getTime() - 86400000);
  const f = d => d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  return `${f(start)} – ${f(last)}`;
}

export function periodProgress(start, end) {
  const total = Math.max(1, Math.round((end - start) / 86400000));
  const elapsed = Math.min(total, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1));
  return { elapsed, total, ratio: elapsed / total };
}

export function fmtDay(iso) {
  const today = todayISO();
  if (iso === today) return 'Today';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === toISODate(y)) return 'Yesterday';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

// --- Toasts ---------------------------------------------------------------

export function toast(message, { actionLabel, onAction, duration = 4500, sticky = false, dismissLabel = '' } = {}) {
  const root = $('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);
  if (actionLabel) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => { onAction && onAction(); dismiss(); });
    el.appendChild(btn);
  }
  if (dismissLabel) {
    const later = document.createElement('button');
    later.className = 'toast-dismiss';
    later.textContent = dismissLabel;
    later.addEventListener('click', () => dismiss());
    el.appendChild(later);
  }
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  let timer = 0;
  if (!sticky) timer = setTimeout(dismiss, duration);
  function dismiss() {
    clearTimeout(timer);
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }
}
