import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { HyperliquidAPI } from './hyperliquid.js';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const hl = new HyperliquidAPI();

const WHALE_THRESHOLD_USD = 100000; // $100k
const INDEX_INTERVAL_MS = 3000; // 3 seconds

interface ProcessedTrade {
  hash: string;
  user: string;
  coin: string;
  side: string;
  size: number;
  price: number;
  valueUsd: number;
  timestamp: number;
  fee: number;
}

class HypurrIndexer {
  private isRunning = false;
  private knownHashes = new Set<string>();
  private trackedAddresses = new Set<string>();

  async start() {
    console.log('🚀 HypurrIndexer starting...');
    this.isRunning = true;

    // Load tracked addresses from DB
    const tracked = await prisma.address.findMany({
      where: { isWhale: true },
      select: { address: true },
    });
    tracked.forEach((a) => this.trackedAddresses.add(a.address));

    // Start multiple workers
    this.runMarketDataLoop();
    this.runWhaleScannerLoop();
    this.runAddressTrackerLoop();
  }

  // Worker 1: Market Data (prices, orderbook)
  private async runMarketDataLoop() {
    while (this.isRunning) {
      try {
        const mids = await hl.getAllMids();
        await redis.setex('market:allMids', 5, JSON.stringify(mids));

        // Calculate market stats
        const prices = Object.entries(mids).map(([coin, price]) => ({
          coin,
          price: parseFloat(price as string),
        }));

        await redis.setex('market:stats', 10, JSON.stringify({
          updatedAt: Date.now(),
          pairs: prices.length,
          topMovers: prices
            .sort((a, b) => b.price - a.price)
            .slice(0, 10),
        }));
      } catch (err) {
        console.error('Market data error:', err);
      }
      await this.sleep(INDEX_INTERVAL_MS);
    }
  }

  // Worker 2: Whale Scanner (detect large trades)
  private async runWhaleScannerLoop() {
    while (this.isRunning) {
      try {
        // Scan recent fills dari semua whale yang kita track
        for (const address of this.trackedAddresses) {
          const fills = await hl.getUserFills(address);

          for (const fill of fills) {
            if (this.knownHashes.has(fill.hash)) continue;

            const valueUsd = parseFloat(fill.px) * parseFloat(fill.sz);
            
            // Index transaction
            await this.indexTrade({
              hash: fill.hash,
              user: address,
              coin: fill.coin,
              side: fill.side,
              size: parseFloat(fill.sz),
              price: parseFloat(fill.px),
              valueUsd,
              timestamp: fill.time,
              fee: parseFloat(fill.fee),
            });

            // Whale activity detection
            if (valueUsd >= WHALE_THRESHOLD_USD) {
              await this.recordWhaleActivity(address, fill, valueUsd);
              
              // Publish real-time alert
              await redis.publish('whale:alert', JSON.stringify({
                address,
                coin: fill.coin,
                side: fill.side,
                size: fill.sz,
                valueUsd,
                timestamp: fill.time,
              }));
            }

            this.knownHashes.add(fill.hash);
          }
        }

        // Cleanup old hashes (keep last 10000)
        if (this.knownHashes.size > 10000) {
          const arr = Array.from(this.knownHashes);
          this.knownHashes = new Set(arr.slice(-5000));
        }
      } catch (err) {
        console.error('Whale scanner error:', err);
      }
      await this.sleep(INDEX_INTERVAL_MS);
    }
  }

  // Worker 3: Address Tracker (update balances, positions)
  private async runAddressTrackerLoop() {
    while (this.isRunning) {
      try {
        for (const address of this.trackedAddresses) {
          const state = await hl.getUserState(address);
          
          // Update address summary
          const accountValue = parseFloat(state.marginSummary.accountValue);
          const totalMargin = parseFloat(state.marginSummary.totalMarginUsed);

          await prisma.address.upsert({
            where: { address },
            update: {
              lastSeen: new Date(),
              totalTxCount: { increment: 0 },
            },
            create: {
              address,
              firstSeen: new Date(),
              lastSeen: new Date(),
              isWhale: accountValue > WHALE_THRESHOLD_USD,
            },
          });

          // Cache positions
          const positions = state.assetPositions.map((ap) => ({
            coin: ap.position.coin,
            szi: ap.position.szi,
            leverage: ap.position.leverage,
            entryPx: ap.position.entryPx,
            positionValue: ap.position.positionValue,
            unrealizedPnl: ap.position.unrealizedPnl,
            liquidationPx: ap.position.liquidationPx,
          }));

          await redis.setex(
            `positions:${address}`,
            30,
            JSON.stringify({
              accountValue,
              totalMargin,
              withdrawable: state.withdrawable,
              positions,
              updatedAt: Date.now(),
            })
          );

          // Auto-detect new whales
          if (accountValue > WHALE_THRESHOLD_USD) {
            await prisma.address.updateMany({
              where: { address, isWhale: false },
              data: { isWhale: true },
            });
            if (!this.trackedAddresses.has(address)) {
              this.trackedAddresses.add(address);
            }
          }
        }
      } catch (err) {
        console.error('Address tracker error:', err);
      }
      await this.sleep(10000); // 10 seconds for positions
    }
  }

  private async indexTrade(trade: ProcessedTrade) {
    // Upsert transaction
    await prisma.transaction.upsert({
      where: { txHash: trade.hash },
      update: {
        value: trade.valueUsd,
        timestamp: new Date(trade.timestamp),
      },
      create: {
        txHash: trade.hash,
        blockNumber: BigInt(0), // Hyperliquid doesn't use traditional blocks for trades
        fromAddress: trade.user,
        toAddress: trade.coin, // Using coin as proxy
        value: trade.valueUsd,
        status: 'success',
        txType: `trade:${trade.side}`,
        timestamp: new Date(trade.timestamp),
      },
    });
  }

  private async recordWhaleActivity(
    address: string,
    fill: any,
    valueUsd: number
  ) {
    await prisma.whaleActivity.create({
      data: {
        walletAddress: address,
        activityType: `large_${fill.side}`,
        asset: fill.coin,
        amountUsd: valueUsd,
        txHash: fill.hash,
        timestamp: new Date(fill.time),
      },
    });

    console.log(`🐋 WHALE ALERT: ${address} ${fill.side} $${valueUsd.toFixed(2)} ${fill.coin}`);
  }

  async addTrackedAddress(address: string) {
    this.trackedAddresses.add(address);
    await prisma.address.upsert({
      where: { address },
      update: {},
      create: {
        address,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
  }
}

// Start
const indexer = new HypurrIndexer();

indexer.start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  indexer.stop();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

export { indexer };
