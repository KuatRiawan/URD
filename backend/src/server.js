import { app } from './app.js';
import { env } from './config/env.js';
import { startReminderJob } from './jobs/reminder-scheduler.js';

const server = app.listen(env.port, () => {
  console.log(`Server PT Upaya Riksa Daya berjalan pada http://localhost:${env.port}`);
  if (!env.isTest) {
    startReminderJob();
  }
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

