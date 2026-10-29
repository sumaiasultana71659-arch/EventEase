import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 8080,
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpires: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()),
  currency: process.env.CURRENCY || '$',
  // multiplies the per-guest costs used by AI suggestions (e.g. 110 if you set CURRENCY to a smaller unit)
  costScale: Number(process.env.COST_SCALE) || 1,
  // the first admin account. `npm run db:seed` creates it / resets its password from these values
  adminName: process.env.ADMIN_NAME || 'Site Admin',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@eventease.com').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Eventease@Admin2026'
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
}
