export interface LockLease {
  key: string;
  token: string;
  expiresAtMs: number;
  release: () => Promise<void>;
}

interface RedisEntry {
  value: string;
  expiresAtMs: number | null;
}

export class InMemoryRedisStore {
  private store = new Map<string, RedisEntry>();

  private pruneIfExpired(key: string, nowMs = Date.now()): void {
    const entry = this.store.get(key);
    if (entry && entry.expiresAtMs !== null && nowMs >= entry.expiresAtMs) {
      this.store.delete(key);
    }
  }

  get(key: string, nowMs = Date.now()): string | null {
    this.pruneIfExpired(key, nowMs);
    return this.store.get(key)?.value ?? null;
  }

  setNxEx(key: string, value: string, ttlSeconds: number, nowMs = Date.now()): boolean {
    this.pruneIfExpired(key, nowMs);
    if (this.store.has(key)) {
      return false;
    }
    this.store.set(key, {
      value,
      expiresAtMs: nowMs + ttlSeconds * 1000,
    });
    return true;
  }

  setEx(key: string, value: string, ttlSeconds: number, nowMs = Date.now()): void {
    this.store.set(key, {
      value,
      expiresAtMs: nowMs + ttlSeconds * 1000,
    });
  }

  ttlSeconds(key: string, nowMs = Date.now()): number {
    this.pruneIfExpired(key, nowMs);
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAtMs === null) return -1;
    return Math.max(0, Math.ceil((entry.expiresAtMs - nowMs) / 1000));
  }

  deleteIfValueMatches(key: string, expectedValue: string): boolean {
    const entry = this.store.get(key);
    if (!entry || entry.value !== expectedValue) {
      return false;
    }
    this.store.delete(key);
    return true;
  }
}

export class RedlockManager {
  private tokenCounter = 0;

  constructor(public readonly redis: InMemoryRedisStore = new InMemoryRedisStore()) {}

  static playerLockKey(playerId: string): string {
    return `lock:player:${playerId}`;
  }

  static clanLockKey(clanId: string): string {
    return `lock:clan:${clanId}`;
  }

  static pixLockKey(txid: string): string {
    return `lock:pix:${txid}`;
  }

  async acquire(key: string, ttlSeconds = 10, nowMs = Date.now()): Promise<LockLease> {
    this.tokenCounter += 1;
    const token = `tok_${nowMs}_${this.tokenCounter}`;
    const ok = this.redis.setNxEx(key, token, ttlSeconds, nowMs);
    if (!ok) {
      throw new Error(`LOCK_CONTENTION:${key}`);
    }
    return {
      key,
      token,
      expiresAtMs: nowMs + ttlSeconds * 1000,
      release: async () => {
        this.redis.deleteIfValueMatches(key, token);
      },
    };
  }

  async withLock<T>(
    key: string,
    fn: () => Promise<T> | T,
    ttlSeconds = 10,
    nowMs = Date.now()
  ): Promise<T> {
    const lease = await this.acquire(key, ttlSeconds, nowMs);
    try {
      return await fn();
    } finally {
      await lease.release();
    }
  }
}
