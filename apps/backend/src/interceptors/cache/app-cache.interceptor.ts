import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager'
import { CallHandler, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants.js'
import { Reflector } from '@nestjs/core'
import { type Cache } from 'cache-manager'
import { Request } from 'express'
import { mergeMap, Observable } from 'rxjs'
import { Cacheable } from 'src/decorators/cacheable/cacheable.decorator.js'
import { InvalidatesCache } from 'src/decorators/invalidates-cache/invalidates-cache.decorator.js'
import { type CacheResource, isCacheResource } from 'src/redis/cache-resource.constants.js'
import { CacheVersionService } from 'src/redis/cache-version.service.js'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

@Injectable()
export class AppCacheInterceptor extends CacheInterceptor {
    constructor(
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        reflector: Reflector,
        private readonly cacheVersionService: CacheVersionService,
    ) {
        super(cacheManager, reflector)
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const request = context.switchToHttp().getRequest<Request>()
        if (!WRITE_METHODS.has(request.method)) return super.intercept(context, next)

        const own = this.resourceOf(context)
        const extra = this.reflector.getAllAndOverride(InvalidatesCache, [context.getHandler(), context.getClass()]) ?? []
        const resources = own ? [own, ...extra] : extra
        if (resources.length === 0) return next.handle()

        return next.handle().pipe(
            mergeMap(async (data: unknown) => {
                await this.cacheVersionService.inc(resources)
                return data
            }),
        )
    }

    protected async trackBy(context: ExecutionContext): Promise<string | undefined> {
        // only cache routes marked with @Cacheable()
        const cacheable = this.reflector.getAllAndOverride(Cacheable, [context.getHandler(), context.getClass()])
        if (!cacheable) return undefined

        // default key: url for GET, undefined otherwise
        const url = await super.trackBy(context)
        if (!url) return undefined

        // controller not in CACHE_RESOURCE, can't be invalidated, so don't cache
        const resource = this.resourceOf(context)
        if (!resource) return undefined

        const version = await this.cacheVersionService.get(resource)
        if (version === null) return undefined // redis down. skip cache.

        // add user id so users don't get each other's data
        const request = context.switchToHttp().getRequest<Request>()
        const userId = request.jwtPayload?.userId ?? 'anon'
        return `${resource}:v${version}:${userId}:${url}`
    }

    /** resource = controller path, e.g. @Controller(CACHE_RESOURCE.conversations) -> 'conversations' */
    private resourceOf(context: ExecutionContext): CacheResource | undefined {
        const path = this.reflector.get<string | string[] | undefined>(PATH_METADATA, context.getClass())
        const first = (Array.isArray(path) ? path[0] : path)?.replace(/^\/+|\/+$/g, '')
        return first && isCacheResource(first) ? first : undefined
    }
}
