import { Reflector } from '@nestjs/core'
import { type CacheResource } from 'src/redis/cache-resource.constants.js'

export const InvalidatesCache = Reflector.createDecorator<CacheResource[]>()
