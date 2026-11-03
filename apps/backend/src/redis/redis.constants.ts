import { createClient } from '@keyv/redis'

export const REDIS_CLIENT = Symbol('REDIS_CLIENT')
export type RedisClient = ReturnType<typeof createClient>
