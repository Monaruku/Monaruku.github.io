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

// Vertical spend bars over generic time buckets (day/week/month) with a
// dashed pace reference line. Over-pace buckets render in danger color.
export function dailyBars(container, { buckets, pacePerBucket = 0, unit = 'day', currency = 'MYR' }) {
  if (!buckets.length) {
    container.innerHTML = `<p class="muted">Nothing spent in this period yet.</p>`;
    return;
  }
  const max = Math.max(1, pacePerBucket, ...buckets.map(b => b.y));
  const pacePct = pacePerBucket > 0 ? (pacePerBucket / max) * 100 : 0;
  container.innerHTML = `
    <div class="daily-chart" role="img" aria-label="Spending by ${unit}, ${buckets.length} ${unit}s">
      ${pacePct ? `<div class="daily-pace" style="bottom:${pacePct.toFixed(1)}%"></div>` : ''}
      ${buckets.map(b => `
        <div class="daily-col">
          <span class="daily-bar ${pacePerBucket && b.y > pacePerBucket ? 'over' : ''}"
                style="height:${((b.y / max) * 100).toFixed(1)}%"
                title="${esc(b.label)}: ${esc(fmtMoney(b.y, currency))}"></span>
        </div>`).join('')}
    </div>
    <div class="chart-foot">
      <span>${esc(buckets[0].label)}</span>
      ${pacePerBucket ? '<span class="muted">dashed = pace</span>' : ''}
      <span>${esc(buckets[buckets.length - 1].label)}</span>
    </div>`;
}

// GitHub-style calendar heatmap of daily spend (Monday-first).
// Intensity tracks the period's max day; over-pace days render in danger color.
export function heatmap(container, { days, pacePerDay = 0, currency = 'MYR' }) {
  if (!days.length) {
    container.innerHTML = `<p class="muted">Nothing spent in this period yet.</p>`;
    return;
  }
  const max = Math.max(1, ...days.map(d => d.y));
  const lead = (days[0].date.getDay() + 6) % 7; // Monday-first offset
  const cells = Array(lead).fill(null).concat(days);
  container.innerHTML = `
    <div class="cal-weekdays" aria-hidden="true">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid" role="img" aria-label="Spending calendar, ${days.length} days">
      ${cells.map(d => d === null ? '<span class="cal-cell blank"></span>' : `
        <span class="cal-cell ${d.y === 0 ? 'zero' : ''} ${pacePerDay && d.y > pacePerDay ? 'over' : ''}"
              style="--int:${(d.y / max).toFixed(2)}"
              title="${esc(d.date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }))}: ${esc(fmtMoney(d.y, currency))}">
          <span class="cal-day">${d.date.getDate()}</span>
        </span>`).join('')}
    </div>
    <div class="cal-legend muted tiny">
      <span>Less</span><span class="cal-scale" aria-hidden="true"></span><span>More</span>
      ${pacePerDay ? '<span class="cal-over-key"><span class="cal-swatch" aria-hidden="true"></span>over pace</span>' : ''}
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
