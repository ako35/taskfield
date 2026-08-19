import { Global, Module } from '@nestjs/common';
import { PG_POOL, pgPoolProvider, PgPoolLifecycle } from './database.provider';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CacheService } from './cache.service';

// Global: pool, guard ve cache diğer tüm modüllerde import gerekmeden kullanılabilir.
@Global()
@Module({
  providers: [pgPoolProvider, PgPoolLifecycle, JwtAuthGuard, CacheService],
  exports: [PG_POOL, JwtAuthGuard, CacheService],
})
export class CommonModule {}
