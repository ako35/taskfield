import { Inject, Injectable, OnModuleDestroy, Provider } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

export const pgPoolProvider: Provider = {
  provide: PG_POOL,
  useFactory: (): Pool => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL tanımlı değil. Kök .env dosyasına PostgreSQL bağlantısını ekleyin.',
      );
    }
    return new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: true }
          : false,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
    });
  },
};

// Closes the single shared pool when the Nest app shuts down.
@Injectable()
export class PgPoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
  }
}
