import type { FastifyInstance } from 'fastify';

export async function whaleRoutes(app: FastifyInstance) {
  // GET /api/whales - List all whales
  app.get('/', async () => {
    const cacheKey = 'whales:list';
    const cached = await app.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const whales = await app.prisma.address.findMany({
      where: { isWhale: true },
      orderBy: { lastSeen: 'desc' },
      take: 50,
    });

    // Enrich with position data
    const enriched = await Promise.all(
      whales.map(async (w) => {
        const posRaw = await app.redis.get(`positions:${w.address}`);
        const positions = posRaw ? JSON.parse(posRaw) : null;
        return {
          address: w.address,
          alias: w.alias,
          firstSeen: w.firstSeen,
          lastSeen: w.lastSeen,
          totalTxCount: w.totalTxCount,
          accountValue: positions?.accountValue || 0,
          positionCount: positions?.positions?.length || 0,
        };
      })
    );

    await app.redis.setex(cacheKey, 15, JSON.stringify(enriched));
    return enriched;
  });

  // GET /api/whales/activities - Recent whale activities
  app.get('/activities', async () => {
    const cacheKey = 'whales:activities';
    const cached = await app.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const activities = await app.prisma.whaleActivity.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        address: {
          select: { alias: true },
        },
      },
    });

    const result = activities.map((a) => ({
      id: a.id,
      address: a.walletAddress,
      alias: a.address?.alias,
      type: a.activityType,
      asset: a.asset,
      amountUsd: a.amountUsd?.toString(),
      timestamp: a.timestamp,
    }));

    await app.redis.setex(cacheKey, 5, JSON.stringify(result));
    return result;
  });

  // POST /api/whales/track - Add new address to track
  app.post('/track', async (request, reply) => {
    const { address } = request.body as { address: string };

    if (!address?.match(/^0x[a-fA-F0-9]{40}$/)) {
      return reply.status(400).send({ error: 'Invalid address' });
    }

    await app.prisma.address.upsert({
      where: { address },
      update: { isWhale: true },
      create: {
        address,
        isWhale: true,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    });

    // Notify indexer via Redis
    await app.redis.publish('indexer:track', address);

    return { success: true, message: `Now tracking ${address}` };
  });
      }
