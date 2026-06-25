import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import WebSocket from 'ws';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const HYPERLIQUID_WS = process.env.HYPERLIQUID_WS || 'wss://rpc.hyperliquid.xyz/ws';

async function startIndexer() {
  console.log('🚀 Starting Hyperliquid Indexer...');
  
  const ws = new WebSocket(HYPERLIQUID_WS);

  ws.on('open', () => {
    console.log('✅ Connected to Hyperliquid WebSocket');
    
    // Subscribe ke blocks (jika tersedia) atau polling
    ws.send(JSON.stringify({
      method: 'subscribe',
      subscription: { type: 'allMids' }
    }));
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      // Proses berbagai tipe data dari Hyperliquid
      if (msg.data?.type === 'allMids') {
        // Market data - bisa di-cache di Redis
        await redis.setex('market:allMids', 1, JSON.stringify(msg.data));
      }
      
      // TODO: Implement block & tx indexing dari Hyperliquid API
      // Hyperliquid punya API khusus yang perlu di-fetch via HTTP
      
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', () => {
    console.log('⚠️ WebSocket closed, reconnecting in 5s...');
    setTimeout(startIndexer, 5000);
  });
}

// HTTP Polling untuk blocks (fallback/reliable method)
async function pollBlocks() {
  const HYPERLIQUID_API = 'https://api.hyperliquid.xyz';
  
  setInterval(async () => {
    try {
      const response = await fetch(`${HYPERLIQUID_API}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' })
      });
      
      const data = await response.json();
      
      // Simpan metadata ke cache
      await redis.setex('hyperliquid:meta', 60, JSON.stringify(data));
      
      // TODO: Parse dan index block data dari response
      
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 5000); // Poll setiap 5 detik
}

// Start
startIndexer();
pollBlocks();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
