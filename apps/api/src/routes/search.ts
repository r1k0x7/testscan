import type { FastifyInstance } from 'fastify';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { q } = request.query as { q?: string };
    
    if (!q || q.length < 3) {
      return reply.status(400).send({ error: 'Query too short' });
    }

    const isHash = q.startsWith('0x') && q.length === 66;
    const isAddress = q.startsWith('0x') && q.length === 42;
    const isBlock = /^\d+$/.test(q);

    const results: any[] = [];

    if (isHash) {
      // Search transaction
      const tx = await app.prisma.transaction.findUnique({
        where: { txHash: q },
        select: { txHash: true, fromAddress: true, toAddress: true, timestamp: true }
      });
      if (tx) {
        results.push({ type: 'transaction', ...tx });
      }
    }

    if (isAddress) {
      // Search address
      const addr = await app.prisma.address.findUnique({
        where: { address: q },
        select: { address: true, alias: true, isWhale: true, totalTxCount: true }
      });
      if (addr) {
        results.push({ type: 'address', ...addr });
      }
      
      // Also search as from/to in transactions
      const txs = await app.prisma.transaction.findMany({
        where: { OR: [{ fromAddress: q }, { toAddress: q }] },
        orderBy: { timestamp: 'desc' },
        take: 5,
        select: { txHash: true, fromAddress: true, toAddress: true, value: true, timestamp: true }
      });
      results.push(...txs.map(t => ({ type: 'transaction', ...t })));
    }

    if (isBlock) {
      const block = await app.prisma.block.findUnique({
        where: { blockNumber: BigInt(q) },
        select: { blockNumber: true, blockHash: true, timestamp: true, txCount: true }
      });
      if (block) {
        results.push({ type: 'block', ...block });
      }
    }

    // Fallback: fuzzy search on alias
    if (results.length === 0 && !isHash && !isBlock) {
      const aliases = await app.prisma.address.findMany({
        where: { alias: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { address: true, alias: true, isWhale: true }
      });
      results.push(...aliases.map(a => ({ type: 'address', ...a })));
    }

    return { query: q, results, count: results.length };
  });
                }
