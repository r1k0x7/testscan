import type { FastifyInstance } from 'fastify';

export async function vaultRoutes(app: FastifyInstance) {
  // GET /api/vaults - List vaults with leaderboard
  app.get('/', async (request) => {
    const { sort = 'apr', limit = 20 } = request.query as { sort?: string; limit?: string };
    
    const cacheKey = `vaults:list:${sort}:${limit}`;
    const cached = await app.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orderBy: any = {};
    if (sort === 'apr') orderBy.apr = 'desc';
    else if (sort === 'pnl') orderBy.totalPnl = 'desc';
    else if (sort === 'tvl') orderBy.totalValue = 'desc';
    else orderBy.createdAt = 'desc';

    const vaults = await app.prisma.vault.findMany({
      orderBy,
      take: parseInt(limit),
      include: {
        _count: { select: { deposits: true } },
      },
    });

    const result = vaults.map((v) => ({
      id: v.id,
      address: v.vaultAddress,
      name: v.name,
      leader: v.leaderAddress,
      tvl: v.totalValue.toString(),
      apr: v.apr?.toString(),
      totalPnl: v.totalPnl?.toString(),
      depositorCount: v.depositorCount,
      maxCapacity: v.maxCapacity?.toString(),
      isOpen: v.isOpen,
      depositCount: v._count.deposits,
    }));

    await app.redis.setex(cacheKey, 30, JSON.stringify(result));
    return result;
  });

  // GET /api/vaults/:address - Vault detail
  app.get('/:address', async (request, reply) => {
    const { address } = request.params as { address: string };

    const vault = await app.prisma.vault.findUnique({
      where: { vaultAddress: address },
      include: {
        deposits: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        pnlHistory: {
          orderBy: { timestamp: 'asc' },
          take: 100,
        },
      },
    });

    if (!vault) {
      return reply.status(404).send({ error: 'Vault not found' });
    }

    // Calculate stats
    const pnlData = vault.pnlHistory.map((p) => ({
      timestamp: p.timestamp,
      totalValue: p.totalValue.toString(),
      totalPnl: p.totalPnl.toString(),
      apr: p.apr?.toString(),
    }));

    return {
      id: vault.id,
      address: vault.vaultAddress,
      name: vault.name,
      description: vault.description,
      leader: vault.leaderAddress,
      tvl: vault.totalValue.toString(),
      apr: vault.apr?.toString(),
      totalPnl: vault.totalPnl?.toString(),
      depositorCount: vault.depositorCount,
      maxCapacity: vault.maxCapacity?.toString(),
      isOpen: vault.isOpen,
      recentDeposits: vault.deposits.map((d) => ({
        depositor: d.depositor,
        amount: d.amount.toString(),
        action: d.action,
        timestamp: d.timestamp,
      })),
      pnlHistory: pnlData,
    };
  });

  // GET /api/vaults/leaderboard - Top performing vaults
  app.get('/leaderboard', async () => {
    const cacheKey = 'vaults:leaderboard';
    const cached = await app.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const topApr = await app.prisma.vault.findMany({
      where: { apr: { not: null }, isOpen: true },
      orderBy: { apr: 'desc' },
      take: 10,
      select: {
        vaultAddress: true,
        name: true,
        leaderAddress: true,
        apr: true,
        totalValue: true,
      },
    });

    const topPnl = await app.prisma.vault.findMany({
      where: { totalPnl: { not: null } },
      orderBy: { totalPnl: 'desc' },
      take: 10,
      select: {
        vaultAddress: true,
        name: true,
        leaderAddress: true,
        totalPnl: true,
        totalValue: true,
      },
    });

    const result = {
      topApr: topApr.map((v) => ({
        address: v.vaultAddress,
        name: v.name,
        leader: v.leaderAddress,
        apr: v.apr?.toString(),
        tvl: v.totalValue.toString(),
      })),
      topPnl: topPnl.map((v) => ({
        address: v.vaultAddress,
        name: v.name,
        leader: v.leaderAddress,
        totalPnl: v.totalPnl?.toString(),
        tvl: v.totalValue.toString(),
      })),
    };

    await app.redis.setex(cacheKey, 60, JSON.stringify(result));
    return result;
  });
        }
