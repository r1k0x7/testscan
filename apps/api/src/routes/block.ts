import type { FastifyInstance } from 'fastify';

export async function blockRoutes(app: FastifyInstance) {
  // GET /api/blocks/latest - 10 blocks terbaru
  app.get('/latest', async (request, reply) => {
    const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };
    
    const cacheKey = `blocks:latest:${limit}:${offset}`;
    const cached = await app.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const blocks = await app.prisma.block.findMany({
      orderBy: { blockNumber: 'desc' },
      take: parseInt(limit as any),
      skip: parseInt(offset as any),
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    const result = blocks.map(b => ({
      number: b.blockNumber,
      hash: b.blockHash,
      timestamp: b.timestamp,
      txCount: b._count.transactions,
      validator: b.validator,
      gasUsed: b.gasUsed?.toString(),
    }));

    // Cache 5 detik
    await app.redis.setex(cacheKey, 5, JSON.stringify(result));
    
    return result;
  });

  // GET /api/blocks/:number
  app.get('/:number', async (request, reply) => {
    const { number } = request.params as { number: string };
    
    const block = await app.prisma.block.findUnique({
      where: { blockNumber: BigInt(number) },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 50,
          select: {
            txHash: true,
            fromAddress: true,
            toAddress: true,
            value: true,
            status: true,
            txType: true,
            timestamp: true,
          }
        }
      }
    });

    if (!block) {
      return reply.status(404).send({ error: 'Block not found' });
    }

    return {
      number: block.blockNumber,
      hash: block.blockHash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      txCount: block.txCount,
      gasUsed: block.gasUsed?.toString(),
      gasLimit: block.gasLimit?.toString(),
      validator: block.validator,
      transactions: block.transactions.map(tx => ({
        hash: tx.txHash,
        from: tx.fromAddress,
        to: tx.toAddress,
        value: tx.value.toString(),
        status: tx.status,
        type: tx.txType,
        timestamp: tx.timestamp,
      }))
    };
  });
          }
