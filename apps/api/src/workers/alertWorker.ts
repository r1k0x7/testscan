import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { HyperliquidAPI } from '../../indexer/src/hyperliquid.js';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const hl = new HyperliquidAPI();

const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

async function startAlertWorker() {
  console.log('🔔 Alert Worker started');

  while (true) {
    try {
      // Get all active alerts
      const alerts = await prisma.priceAlert.findMany({
        where: { isActive: true },
      });

      if (alerts.length === 0) {
        await sleep(CHECK_INTERVAL_MS);
        continue;
      }

      // Fetch current prices
      const mids = await hl.getAllMids();
      const prices: Record<string, number> = {};
      for (const [coin, price] of Object.entries(mids)) {
        prices[coin] = parseFloat(price as string);
      }

      for (const alert of alerts) {
        const currentPrice = prices[alert.asset];
        if (!currentPrice) continue;

        let triggered = false;
        let message = '';

        // Update current price
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { currentPrice },
        });

        if (alert.condition === 'above' && currentPrice >= parseFloat(alert.targetPrice.toString())) {
          triggered = true;
          message = `${alert.asset} is now $${currentPrice.toFixed(2)} (above $${alert.targetPrice})`;
        } else if (alert.condition === 'below' && currentPrice <= parseFloat(alert.targetPrice.toString())) {
          triggered = true;
          message = `${alert.asset} is now $${currentPrice.toFixed(2)} (below $${alert.targetPrice})`;
        } else if (alert.condition === 'percent_change' && alert.percentThreshold) {
          const prevPrice = parseFloat(alert.currentPrice?.toString() || '0');
          if (prevPrice > 0) {
            const change = ((currentPrice - prevPrice) / prevPrice) * 100;
            if (Math.abs(change) >= parseFloat(alert.percentThreshold.toString())) {
              triggered = true;
              message = `${alert.asset} moved ${change.toFixed(2)}% (now $${currentPrice.toFixed(2)})`;
            }
          }
        }

        if (triggered) {
          // Update alert
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              triggeredAt: new Date(),
              triggerCount: { increment: 1 },
              lastNotifiedAt: new Date(),
            },
          });

          // Publish to Redis for WebSocket broadcast
          await redis.publish('alert:triggered', JSON.stringify({
            alertId: alert.id,
            userId: alert.userId,
            asset: alert.asset,
            condition: alert.condition,
            targetPrice: alert.targetPrice,
            currentPrice,
            message,
            timestamp: Date.now(),
          }));

          // TODO: Send email/webhook here
          console.log(`🚨 ALERT TRIGGERED: ${message}`);
        }
      }
    } catch (err) {
      console.error('Alert worker error:', err);
    }

    await sleep(CHECK_INTERVAL_MS);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

startAlertWorker().catch(console.error);

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
