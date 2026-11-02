import { CacheInterceptor } from '@nestjs/cache-manager'
import { ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { Cacheable } from 'src/decorators/cacheable/cacheable.decorator.js'

@Injectable()
export class AppCacheInterceptor extends CacheInterceptor {
    protected async trackBy(context: ExecutionContext): Promise<string | undefined> {
        // only cache routes marked with @Cacheable()
        const cacheable = this.reflector.getAllAndOverride(Cacheable, [context.getHandler(), context.getClass()])
        if (!cacheable) return undefined

        // default key: url for GET, undefined otherwise
        const key = await super.trackBy(context)
        if (!key) return undefined

        // add user id so users don't get each other's data
        const request = context.switchToHttp().getRequest<Request>()
        const userId = request.jwtPayload?.userId ?? 'anon'
        return `${userId}:${key}`
    }
}
