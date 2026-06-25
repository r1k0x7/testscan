// Hyperliquid API Types & Client
// Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api

export interface HyperliquidMeta {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated: boolean;
  }>;
}

export interface HyperliquidUserFills {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
}

export interface HyperliquidUserState {
  assetPositions: Array<{
    type: string;
    position: {
      coin: string;
      szi: string;
      leverage: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      marginUsed: string;
      liquidationPx: string | null;
    };
  }>;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalRawUsd: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalRawUsd: string;
  };
  withdrawable: string;
}

export class HyperliquidAPI {
  private baseUrl = 'https://api.hyperliquid.xyz';
  private infoUrl = 'https://api.hyperliquid.xyz/info';

  async getMeta(): Promise<HyperliquidMeta> {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    return res.json();
  }

  async getUserState(userAddress: string): Promise<HyperliquidUserState> {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: userAddress,
      }),
    });
    return res.json();
  }

  async getUserFills(userAddress: string): Promise<HyperliquidUserFills[]> {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'userFills',
        user: userAddress,
      }),
    });
    return res.json();
  }

  async getOrderBook(coin: string) {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'l2Book',
        coin: coin,
      }),
    });
    return res.json();
  }

  async getAllMids() {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
    });
    return res.json();
  }

  async getUserFunding(userAddress: string) {
    const res = await fetch(this.infoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'userFunding',
        user: userAddress,
        startTime: Date.now() - 86400000 * 7, // 7 days ago
      }),
    });
    return res.json();
  }
    }
