import cron from 'node-cron';
import { exchangeRateService } from '../services/exchangeRate.service';

let cronJob: cron.ScheduledTask | null = null;

const CRON_EXPRESSION = '*/5 * * * *'; // Her 5 dakikada bir kontrol et

export function startExchangeRateCron(): void {
  if (cronJob) {
    console.warn('[Cron] Exchange rate job already running, skipping duplicate start');
    return;
  }

  cronJob = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const settings = await exchangeRateService.getSettings();

      // Sadece auto modunda calis
      if (settings.updateMode !== 'auto') return;

      const now = new Date();
      const lastUpdate = settings.lastAutoUpdate;

      // Interval gecmediyse bekle
      if (lastUpdate) {
        const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1_000 * 60);
        if (diffMinutes < settings.updateInterval) return;
      }

      console.log('[Cron] Auto-updating exchange rates...');
      const results = await exchangeRateService.autoUpdate();
      console.log(`[Cron] Exchange rates updated — ${results.length} currencies refreshed`);
    } catch (error) {
      // Hata uygulama akisini kirmamali
      console.error('[Cron] Exchange rate auto-update failed:', error);
    }
  });

  console.log('[Cron] Exchange rate job started (checks every 5 minutes)');
}

export function stopExchangeRateCron(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Cron] Exchange rate job stopped');
  }
}
