import type { FastifyInstance } from 'fastify';

export async function exportRoutes(app: FastifyInstance) {
  // POST /api/export - Export user data
  app.post('/', async (request, reply) => {
    const { userId, type } = request.body as { userId: string; type: string };

    let content: any = {};

    if (type === 'bundles' || type === 'all') {
      const bundles = await app.prisma.bundle.findMany({
        where: { userId },
      });
      content.bundles = bundles.map((b) => ({
        name: b.name,
        description: b.description,
        addresses: b.addresses,
        color: b.color,
        isPublic: b.isPublic,
      }));
    }

    if (type === 'aliases' || type === 'all') {
      const aliases = await app.prisma.address.findMany({
        where: { alias: { not: null } },
        select: { address: true, alias: true },
      });
      content.aliases = aliases;
    }

    if (type === 'alerts' || type === 'all') {
      const alerts = await app.prisma.priceAlert.findMany({
        where: { userId },
      });
      content.alerts = alerts.map((a) => ({
        asset: a.asset,
        condition: a.condition,
        targetPrice: a.targetPrice?.toString(),
        percentThreshold: a.percentThreshold?.toString(),
      }));
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      type,
      content,
    };

    // Save to DB
    await app.prisma.dataExport.create({
      data: {
        userId,
        exportType: type,
        fileName: `hypurrscan-export-${type}-${Date.now()}.json`,
        fileSize: JSON.stringify(exportData).length,
        content: exportData,
      },
    });

    return {
      success: true,
      data: exportData,
      downloadUrl: `/api/export/download?userId=${userId}&type=${type}`,
    };
  });

  // GET /api/export/download - Download export
  app.get('/download', async (request, reply) => {
    const { userId, type } = request.query as { userId: string; type: string };

    const latestExport = await app.prisma.dataExport.findFirst({
      where: { userId, exportType: type },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestExport) {
      return reply.status(404).send({ error: 'No export found' });
    }

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="${latestExport.fileName}"`);
    return JSON.stringify(latestExport.content, null, 2);
  });

  // POST /api/export/import - Import data
  app.post('/import', async (request, reply) => {
    const { userId, data } = request.body as { userId: string; data: any };

    if (!data || data.version !== '1.0') {
      return reply.status(400).send({ error: 'Invalid import file' });
    }

    const results = { bundles: 0, aliases: 0, alerts: 0 };

    // Import bundles
    if (data.content?.bundles) {
      for (const bundle of data.content.bundles) {
        await app.prisma.bundle.create({
          data: {
            userId,
            name: bundle.name,
            description: bundle.description,
            addresses: bundle.addresses,
            color: bundle.color,
            isPublic: bundle.isPublic || false,
          },
        });
        results.bundles++;
      }
    }

    // Import aliases
    if (data.content?.aliases) {
      for (const alias of data.content.aliases) {
        await app.prisma.address.upsert({
          where: { address: alias.address },
          update: { alias: alias.alias },
          create: {
            address: alias.address,
            alias: alias.alias,
            firstSeen: new Date(),
            lastSeen: new Date(),
          },
        });
        results.aliases++;
      }
    }

    // Import alerts
    if (data.content?.alerts) {
      for (const alert of data.content.alerts) {
        await app.prisma.priceAlert.create({
          data: {
            userId,
            asset: alert.asset,
            condition: alert.condition,
            targetPrice: alert.targetPrice ? parseFloat(alert.targetPrice) : 0,
            percentThreshold: alert.percentThreshold ? parseFloat(alert.percentThreshold) : null,
          },
        });
        results.alerts++;
      }
    }

    return { success: true, imported: results };
  });
           }
