// Lightweight SVG/CSS charts. Hand-rolled instead of Chart.js so the app
// stays fully offline with zero vendor weight (spec deviation, documented).

import { esc, fmtMoney } from './util.js';

// Horizontal bars, e.g. spend per category.
export function bars(container, data, { currency = 'MYR', empty = 'No data for this period yet.' } = {}) {
  if (!data.length) {
    container.innerHTML = `<p class="muted">${esc(empty)}</p>`;
    return;
  }
  const max = Math.max(1, ...data.map(d => d.value));
  container.innerHTML = data.map(d => `
    <div class="bar-row">
      <span class="bar-label">${esc(d.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(d.value / max * 100).toFixed(1)}%;background:${d.color || 'var(--accent)'}"></span></span>
      <span class="bar-value">${fmtMoney(d.value, currency)}</span>
    </div>`).join('');
}

// Cumulative daily spend against an optional straight-line pace reference.
export function paceLine(container, { points, paceTo = 0, currency = 'MYR' }) {
  if (!points.length) {
    container.innerHTML = `<p class="muted">Nothing spent in this period yet.</p>`;
    return;
  }
  const W = 100, H = 42, pad = 3;
  const maxY = Math.max(1, ...points.map(p => p.y), paceTo);
  const maxX = Math.max(1, points[points.length - 1].x);
  const px = p => (pad + (p.x / maxX) * (W - 2 * pad)).toFixed(2);
  const py = y => (H - pad - (y / maxY) * (H - 2 * pad)).toFixed(2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${px(p)},${py(p.y)}`).join(' ');
  const last = points[points.length - 1];
  const area = `${line} L${px(last)},${H - pad} L${pad},${H - pad} Z`;
  const guide = paceTo ? `M${pad},${H - pad} L${W - pad},${py(paceTo)}` : '';
  container.innerHTML = `
    <svg class="line-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
         role="img" aria-label="Cumulative spend ${esc(fmtMoney(last.y, currency))}">
      ${guide ? `<path d="${guide}" class="pace-guide"/>` : ''}
      <path d="${area}" class="area"/>
      <path d="${line}" class="line"/>
    </svg>
    <div class="chart-foot">
      <span>Day 1</span>
      <span class="muted">dashed = budget pace</span>
      <span>Day ${maxX}</span>
    </div>`;
}

// Grouped expense/income columns for recent periods.
export function compareBars(container, months, { currency = 'MYR' } = {}) {
  const max = Math.max(1, ...months.map(m => Math.max(m.expense, m.income)));
  container.innerHTML = `
    <div class="compare">
      ${months.map(m => `
        <div class="compare-col">
          <div class="compare-bars">
            <span class="cb expense" style="height:${(m.expense / max * 100).toFixed(1)}%"
                  title="Spent ${esc(fmtMoney(m.expense, currency))}"></span>
            <span class="cb income" style="height:${(m.income / max * 100).toFixed(1)}%"
                  title="Income ${esc(fmtMoney(m.income, currency))}"></span>
          </div>
          <span class="compare-label">${esc(m.label)}</span>
        </div>`).join('')}
    </div>
    <div class="legend"><span class="dot expense"></span>Spent<span class="dot income"></span>Income</div>`;
}
