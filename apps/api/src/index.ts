import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { blockRoutes } from './routes/blocks.js';
import { txRoutes } from './routes/transactions.js';
import { addressRoutes } from './routes/addresses.js';
import { searchRoutes } from './routes/search.js';
import { wsRoutes } from './routes/websocket.js';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const app = Fastify({
  logger: true,
});

// Register plugins
await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(websocket);

// Decorate with DB instances
app.decorate('prisma', prisma);
app.decorate('redis', redis);

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
await app.register(blockRoutes, { prefix: '/api/blocks' });
await app.register(txRoutes, { prefix: '/api/transactions' });
await app.register(addressRoutes, { prefix: '/api/addresses' });
await app.register(searchRoutes, { prefix: '/api/search' });
await app.register(wsRoutes, { prefix: '/ws' });

// Start
const PORT = parseInt(process.env.PORT || '3001');

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 API running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await app.close();
  await prisma.$disconnect();
  await redis.quit();
});
