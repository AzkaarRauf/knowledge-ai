import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'
import { SKIP_ALL_THROTTLERS } from 'src/throttle/throttle.constants.js'

@SkipAuth()
// probes and deploy checks must never be rate limited
@SkipThrottle(SKIP_ALL_THROTTLERS)
@Controller({
    path: 'health',
    version: VERSION_NEUTRAL,
})
export class HealthController {
    constructor() {}

    @Get()
    health() {
        return { status: 'ok' }
    }
}
