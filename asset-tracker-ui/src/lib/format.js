import { config } from '../config.js';

export const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 0,
  }).format(n);
};

export const moneyExact = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
  }).format(n);
};

export const shortDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(config.locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(d);
};

export const today = () => new Date().toISOString().slice(0, 10);

export const daysUntil = (iso) => {
  if (!iso) return null;
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  const now = new Date(`${today()}T00:00:00Z`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.round((then - now) / 86400000);
};

export const dueLabel = (iso) => {
  const d = daysUntil(iso);
  if (d === null) return { text: 'No date set', overdue: false };
  if (d < 0) return { text: `Overdue by ${Math.abs(d)} days`, overdue: true };
  if (d === 0) return { text: 'Due today', overdue: true };
  if (d <= 30) return { text: `Due in ${d} days`, overdue: false };
  return { text: `Next service ${shortDate(iso)}`, overdue: false };
};
