/**
 * Resources that can be cached. Each value is also the controller path,
 * so the cache interceptor can find the resource of a request.
 */
export const CACHE_RESOURCE = {
    conversations: 'conversations',
    departments: 'departments',
    documents: 'documents',
    users: 'users',
} as const

export type CacheResource = (typeof CACHE_RESOURCE)[keyof typeof CACHE_RESOURCE]

const cacheResources = new Set<string>(Object.values(CACHE_RESOURCE))

export const isCacheResource = (value: string): value is CacheResource => cacheResources.has(value)
