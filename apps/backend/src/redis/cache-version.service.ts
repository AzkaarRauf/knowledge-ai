import { Inject, Injectable, Logger } from '@nestjs/common'
import { REDIS_CLIENT, type RedisClient } from './redis.constants.js'
import { type CacheResource } from './cache-resource.constants.js'
import { isError, safe } from 'shared'

@Injectable()
export class CacheVersionService {
    private logger = new Logger(CacheVersionService.name)

    constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

    private key(resource: CacheResource) {
        return `cache-version:${resource}`
    }
    async get(resource: CacheResource) {
        const version = await safe(this.redis.get(this.key(resource)))
        if (isError(version)) {
            this.logger.error(version)
            return null
        }
        return version ?? '0'
    }
    async inc(resources: CacheResource[]) {
        const settled = await Promise.allSettled(resources.map((resource) => this.redis.incr(this.key(resource))))
        for (const promise of settled) {
            if (promise.status === 'rejected') {
                this.logger.error(promise.reason)
            }
        }
    }
}
