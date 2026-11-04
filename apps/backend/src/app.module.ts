import { createKeyv } from '@keyv/redis'
import { BullModule } from '@nestjs/bullmq'
import { CacheModule } from '@nestjs/cache-manager'
import { ArgumentsHost, Catch, HttpException, Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, BaseExceptionFilter } from '@nestjs/core'
import { ZodSerializationException, ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { RoleGuard } from 'src/role/role.guard.js'
import { ZodError } from 'zod'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthGuard } from './auth/auth.guard.js'
import { AuthModule } from './auth/auth.module.js'
import { ConversationsModule } from './conversations/conversations.module.js'
import { DepartmentsModule } from './departments/departments.module.js'
import { DocumentsModule } from './documents/documents.module.js'
import { EmbeddingModule } from './embedding/embedding.module.js'
import { env } from './env.js'
import { HashingModule } from './hashing/hashing.module.js'
import { HealthModule } from './health/health.module.js'
import { AppCacheInterceptor } from './interceptors/cache/app-cache.interceptor.js'
import { LoggingInterceptor } from './interceptors/logging/logging.interceptor.js'
import { LLMModule } from './llm/llm.module.js'
import { RequestIdMiddleware } from './middlewares/request-id/request-id.middleware.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { PrismaService } from './prisma/prisma.service.js'
import { RAGModule } from './rag/rag.module.js'
import { REDIS_CLIENT, RedisClient } from './redis/redis.constants.js'
import { RedisModule } from './redis/redis.module.js'
import { S3Module } from './s3/s3.module.js'
import { UsersModule } from './users/users.module.js'
import { ThrottlerModule } from '@nestjs/throttler'
import { type Response } from 'express'
import { AppThrottlerGuard } from './throttle/app-throttler.guard.js'
import { RedisThrottlerStorage } from './throttle/redis-throttler.storage.js'
import { THROTTLERS } from './throttle/throttle.constants.js'

@Catch(HttpException)
class HttpExceptionFilter extends BaseExceptionFilter {
    private logger = new Logger(HttpExceptionFilter.name)

    catch(exception: HttpException, host: ArgumentsHost) {
        if (exception instanceof ZodSerializationException) {
            const zodError = exception.getZodError()

            if (zodError instanceof ZodError) {
                this.logger.error(`ZodSerializationException: ${zodError.message}`)
            }
        }

        // rate limit errors carry retryAfterSec. also send it as the standard header
        const body = exception.getResponse()
        const res = host.switchToHttp().getResponse<Response>()
        if (typeof body === 'object' && 'retryAfterSec' in body && typeof body.retryAfterSec === 'number' && !res.headersSent) {
            res.setHeader('Retry-After', body.retryAfterSec)
        }

        super.catch(exception, host)
    }
}

@Module({
    imports: [
        AuthModule,
        ConversationsModule,
        DepartmentsModule,
        HealthModule,
        PrismaModule,
        UsersModule,
        HashingModule,
        DocumentsModule,
        S3Module,
        EmbeddingModule,
        LLMModule,
        RAGModule,
        RedisModule,
        CacheModule.registerAsync({
            imports: [RedisModule],
            inject: [REDIS_CLIENT],
            isGlobal: true,
            useFactory: async (client: RedisClient) => {
                const redisStore = createKeyv(client)
                redisStore.setTtl(env.REDIS_CACHE_TTL_MS ?? 5 * 1000)
                return { stores: [redisStore] }
            },
        }),
        BullModule.forRoot({
            connection: { url: env.REDIS_CONNECTION_STRING },
        }),
        ThrottlerModule.forRootAsync({
            inject: [REDIS_CLIENT],
            useFactory: (client: RedisClient) => ({
                throttlers: [...THROTTLERS],
                storage: new RedisThrottlerStorage(client),
            }),
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        PrismaService,
        {
            // must be first so it wraps the zod serializer and caches the serialized response
            provide: APP_INTERCEPTOR,
            useClass: AppCacheInterceptor,
        },
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
        },
        {
            // after AuthGuard, so it can count per user id
            provide: APP_GUARD,
            useClass: AppThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIdMiddleware).forRoutes('*')
    }
}
