import type { FastifyInstance } from 'fastify';

export async function addressRoutes(app: FastifyInstance) {
  // GET /api/addresses/:address
  app.get('/:address', async (request, reply) => {
    const { address } = request.params as { address: string };

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return reply.status(400).send({ error: 'Invalid address format' });
    }

    const cacheKey = `address:${address}`;
    const cached = await app.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from DB
    const dbAddress = await app.prisma.address.findUnique({
      where: { address },
    });

    // Get positions from cache (set by indexer)
    const positionsRaw = await app.redis.get(`positions:${address}`);
    const positions = positionsRaw ? JSON.parse(positionsRaw) : null;

    // Get recent transactions
    const recentTxs = await app.prisma.transaction.findMany({
      where: { OR: [{ fromAddress: address }, { toAddress: address }] },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        txHash: true,
        fromAddress: true,
        toAddress: true,
        value: true,
        status: true,
        txType: true,
        timestamp: true,
      },
    });

    // Get whale activities
    const whaleActivities = await app.prisma.whaleActivity.findMany({
      where: { walletAddress: address },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const result = {
      address,
      alias: dbAddress?.alias,
      isWhale: dbAddress?.isWhale || false,
      firstSeen: dbAddress?.firstSeen,
      lastSeen: dbAddress?.lastSeen,
      totalTxCount: dbAddress?.totalTxCount || 0,
      positions: positions || null,
      recentTransactions: recentTxs.map((tx) => ({
        hash: tx.txHash,
        from: tx.fromAddress,
        to: tx.toAddress,
        value: tx.value.toString(),
        status: tx.status,
        type: tx.txType,
        timestamp: tx.timestamp,
      })),
      whaleActivities: whaleActivities.map((wa) => ({
        type: wa.activityType,
        asset: wa.asset,
        amountUsd: wa.amountUsd?.toString(),
        timestamp: wa.timestamp,
      })),
    };

    // Cache 10 detik
    await app.redis.setex(cacheKey, 10, JSON.stringify(result));

    return result;
  });

  // GET /api/addresses/:address/positions
  app.get('/:address/positions', async (request, reply) => {
    const { address } = request.params as { address: string };
    const positionsRaw = await app.redis.get(`positions:${address}`);

    if (!positionsRaw) {
      return reply.status(404).send({ error: 'No position data available' });
    }

    return JSON.parse(positionsRaw);
  });

  // GET /api/addresses/:address/history
  app.get('/:address/history', async (request) => {
    const { address } = request.params as { address: string };
    const { limit = 50, offset = 0 } = request.query as any;

    const txs = await app.prisma.transaction.findMany({
      where: { OR: [{ fromAddress: address }, { toAddress: address }] },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const count = await app.prisma.transaction.count({
      where: { OR: [{ fromAddress: address }, { toAddress: address }] },
    });

    return {
      data: txs,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  });
          }
