import type { FastifyInstance } from 'fastify';

export async function txRoutes(app: FastifyInstance) {
  // GET /api/transactions/latest
  app.get('/latest', async (request) => {
    const { limit = 20, type } = request.query as { limit?: number; type?: string };
    
    const where = type ? { txType: type } : {};
    
    const txs = await app.prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as any),
      select: {
        txHash: true,
        fromAddress: true,
        toAddress: true,
        value: true,
        status: true,
        txType: true,
        timestamp: true,
        blockNumber: true,
      }
    });

    return txs.map(tx => ({
      hash: tx.txHash,
      from: tx.fromAddress,
      to: tx.toAddress,
      value: tx.value.toString(),
      status: tx.status,
      type: tx.txType,
      timestamp: tx.timestamp,
      blockNumber: tx.blockNumber.toString(),
    }));
  });

  // GET /api/transactions/:hash
  app.get('/:hash', async (request, reply) => {
    const { hash } = request.params as { hash: string };
    
    const tx = await app.prisma.transaction.findUnique({
      where: { txHash: hash },
      include: { block: true }
    });

    if (!tx) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    return {
      hash: tx.txHash,
      blockNumber: tx.blockNumber.toString(),
      blockHash: tx.block.blockHash,
      from: tx.fromAddress,
      to: tx.toAddress,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: tx.gasUsed?.toString(),
      status: tx.status,
      type: tx.txType,
      input: tx.inputData,
      timestamp: tx.timestamp,
    };
  });
        }
