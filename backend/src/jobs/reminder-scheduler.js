import cron from 'node-cron';
import { dispatchDueReminders } from '../modules/reminders/routes.js';
import { dispatchClientReminders } from '../services/client-reminders.js';

export function startReminderJob() {
  // Berjalan setiap hari pukul 07:00 waktu server
  return cron.schedule('0 7 * * *', async () => {
    try {
      await dispatchDueReminders();
    } catch (err) {
      console.error('Gagal menjalankan evaluasi pengingat harian:', err.message);
    }
    try {
      const summary = await dispatchClientReminders();
      console.log('Pengingat klien harian:', JSON.stringify(summary));
    } catch (err) {
      console.error('Gagal mengirim pengingat otomatis ke klien:', err.message);
    }
  });
}

