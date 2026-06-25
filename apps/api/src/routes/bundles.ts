import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createBundleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  addresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isPublic: z.boolean().default(false),
});

export async function bundleRoutes(app: FastifyInstance) {
  // GET /api/bundles - List user's bundles
  app.get('/', async (request) => {
    const { userId } = request.query as { userId?: string };
    if (!userId) return { error: 'userId required' };

    const bundles = await app.prisma.bundle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with aggregated stats
    const enriched = await Promise.all(
      bundles.map(async (bundle) => {
        const positions = await Promise.all(
          bundle.addresses.map(async (addr) => {
            const posRaw = await app.redis.get(`positions:${addr}`);
            return posRaw ? JSON.parse(posRaw) : null;
          })
        );

        const totalValue = positions.reduce((sum, p) => sum + (p?.accountValue || 0), 0);
        const openPositions = positions.reduce((sum, p) => sum + (p?.positions?.length || 0), 0);

        return {
          ...bundle,
          totalValue,
          openPositions,
          addressCount: bundle.addresses.length,
        };
      })
    );

    return enriched;
  });

  // POST /api/bundles - Create bundle
  app.post('/', async (request, reply) => {
    try {
      const body = createBundleSchema.parse(request.body);
      const { userId } = request.query as { userId: string };

      const bundle = await app.prisma.bundle.create({
        data: {
          userId,
          name: body.name,
          description: body.description,
          addresses: body.addresses,
          color: body.color,
          isPublic: body.isPublic,
        },
      });

      return bundle;
    } catch (err) {
      return reply.status(400).send({ error: 'Invalid input', details: err });
    }
  });

  // GET /api/bundles/:id - Get bundle detail
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const bundle = await app.prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return reply.status(404).send({ error: 'Bundle not found' });
    }

    // Get all positions for addresses in bundle
    const addressDetails = await Promise.all(
      bundle.addresses.map(async (addr) => {
        const posRaw = await app.redis.get(`positions:${addr}`);
        const positions = posRaw ? JSON.parse(posRaw) : null;
        
        const dbAddr = await app.prisma.address.findUnique({
          where: { address: addr },
          select: { alias: true, isWhale: true },
        });

        return {
          address: addr,
          alias: dbAddr?.alias,
          isWhale: dbAddr?.isWhale || false,
          accountValue: positions?.accountValue || 0,
          totalMargin: positions?.totalMargin || 0,
          openPositions: positions?.positions?.length || 0,
          positions: positions?.positions || [],
        };
      })
    );

    const totalValue = addressDetails.reduce((sum, a) => sum + a.accountValue, 0);
    const totalMargin = addressDetails.reduce((sum, a) => sum + a.totalMargin, 0);
    const totalPositions = addressDetails.reduce((sum, a) => sum + a.openPositions, 0);

    return {
      ...bundle,
      stats: {
        totalValue,
        totalMargin,
        totalPositions,
        addressCount: bundle.addresses.length,
      },
      addresses: addressDetails,
    };
  });

  // PUT /api/bundles/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.query as { userId: string };

    try {
      const body = createBundleSchema.partial().parse(request.body);

      const existing = await app.prisma.bundle.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Bundle not found' });
      }

      const updated = await app.prisma.bundle.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          addresses: body.addresses,
          color: body.color,
          isPublic: body.isPublic,
        },
      });

      return updated;
    } catch (err) {
      return reply.status(400).send({ error: 'Invalid input' });
    }
  });

  // DELETE /api/bundles/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.query as { userId: string };

    const existing = await app.prisma.bundle.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Bundle not found' });
    }

    await app.prisma.bundle.delete({ where: { id } });
    return { success: true };
  });
          }
