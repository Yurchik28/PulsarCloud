import { startBillingCron } from './billing';

// Запускаем биллинг: каждая секунда создаются записи, каждые 10 секунд пересчет totals
startBillingCron(1000);
console.log("[BillingCron] Started");
