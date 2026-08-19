import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Best-effort read-through cache. If REDIS_URL is not set or Redis is
 * unreachable, all operations are no-ops so requests always fall back to
 * the database instead of failing.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis | null;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.client = null;
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis bağlantı hatası: ${error.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // cache is best-effort; ignore write failures
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined);
  }
}
