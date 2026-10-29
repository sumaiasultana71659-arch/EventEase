// ====== Global config ======
export const CONFIG = {
  // true  = fake backend inside the browser (localStorage) - works with NO server.
  // false = talk to your real Spring Boot REST API.
  USE_MOCK: false,
  API_URL: 'http://localhost:8080/api',
  CURRENCY: '$'
};

export const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Conference', 'Concert', 'Other'];

export const CATEGORIES = [
  { key: 'venue', label: 'Venue' },
  { key: 'food', label: 'Food' },
  { key: 'decoration', label: 'Decoration' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'misc', label: 'Miscellaneous' }
];

export const CAT_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
