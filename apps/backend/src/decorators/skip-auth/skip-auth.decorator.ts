import { Reflector } from '@nestjs/core'

const SKIP_AUTH_KEY = 'skipAuth'
export const SkipAuth = Reflector.createDecorator<boolean>({
    key: SKIP_AUTH_KEY,
    transform: (value) => value ?? true,
})
