import { Global, Logger, Module } from '@nestjs/common'
import { REDIS_CLIENT } from './redis.constants.js'
import { createClient } from '@keyv/redis'
import { env } from 'src/env.js'
import { CacheVersionService } from './cache-version.service.js'

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: async () => {
                const client = createClient({ url: env.REDIS_CONNECTION_STRING, disableOfflineQueue: true })
                client.on('error', (e) => Logger.error('Redis Error', e, 'Redis'))
                await client.connect()
                return client
            },
        },
        CacheVersionService,
    ],
    exports: [REDIS_CLIENT, CacheVersionService],
})
export class RedisModule {}
