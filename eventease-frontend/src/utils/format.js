import { CONFIG, CATEGORIES } from '../config';

export const money = n => CONFIG.CURRENCY + Math.round(Number(n) || 0).toLocaleString();

export const fmtDate = d =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hh = Number(h);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};

export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const iso = d =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export const daysUntil = date => Math.round((new Date(date + 'T00:00:00') - today()) / 86400000);

export const catLabel = key => (CATEGORIES.find(c => c.key === key) || { label: key }).label;

export const sum = (list, pick) => list.reduce((s, x) => s + pick(x), 0);
