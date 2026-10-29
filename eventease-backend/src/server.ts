import { app } from './app';
import { config } from './config';
import { prisma } from './prisma';

const server = app.listen(config.port, () => {
  console.log(`EventEase API running on http://localhost:${config.port}/api`);
});

// close the database connection when you press Ctrl + C
process.on('SIGINT', async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
