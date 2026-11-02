import { Reflector } from '@nestjs/core'

const CACHEABLE_KEY = 'cacheable'
export const Cacheable = Reflector.createDecorator<boolean>({
    key: CACHEABLE_KEY,
    transform: (value) => value ?? true,
})
