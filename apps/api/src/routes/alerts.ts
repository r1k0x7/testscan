import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createAlertSchema = z.object({
  asset: z.string().min(1).max(20),
  condition: z.enum(['above', 'below', 'percent_change']),
  targetPrice: z.number().positive().optional(),
  percentThreshold: z.number().optional(),
});

export async function alertRoutes(app: FastifyInstance) {
  // GET /api/alerts - List user's alerts
  app.get('/', async (request) => {
    const { userId } = request.query as { userId?: string };
    if (!userId) return { error: 'userId required' };

    const alerts = await app.prisma.priceAlert.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a) => ({
      id: a.id,
      asset: a.asset,
      condition: a.condition,
      targetPrice: a.targetPrice?.toString(),
      currentPrice: a.currentPrice?.toString(),
      percentThreshold: a.percentThreshold?.toString(),
      isActive: a.isActive,
      triggeredAt: a.triggeredAt,
      triggerCount: a.triggerCount,
      createdAt: a.createdAt,
    }));
  });

  // POST /api/alerts - Create alert
  app.post('/', async (request, reply) => {
    try {
      const body = createAlertSchema.parse(request.body);
      const { userId } = request.query as { userId: string };

      // Get current price from cache
      const marketData = await app.redis.get('market:allMids');
      const prices = marketData ? JSON.parse(marketData) : {};
      const currentPrice = prices[body.asset] ? parseFloat(prices[body.asset]) : null;

      const alert = await app.prisma.priceAlert.create({
        data: {
          userId,
          asset: body.asset,
          condition: body.condition,
          targetPrice: body.targetPrice || 0,
          percentThreshold: body.percentThreshold || null,
          currentPrice: currentPrice || 0,
        },
      });

      return {
        id: alert.id,
        asset: alert.asset,
        condition: alert.condition,
        targetPrice: alert.targetPrice?.toString(),
        currentPrice: alert.currentPrice?.toString(),
        isActive: alert.isActive,
      };
    } catch (err) {
      return reply.status(400).send({ error: 'Invalid input', details: err });
    }
  });

  // DELETE /api/alerts/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.query as { userId?: string };

    const alert = await app.prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    await app.prisma.priceAlert.delete({ where: { id } });
    return { success: true };
  });

  // GET /api/alerts/triggered - Get triggered alerts
  app.get('/triggered', async (request) => {
    const { userId } = request.query as { userId?: string };
    
    const alerts = await app.prisma.priceAlert.findMany({
      where: { 
        userId,
        triggeredAt: { not: null },
      },
      orderBy: { triggeredAt: 'desc' },
      take: 20,
    });

    return alerts;
  });
}
