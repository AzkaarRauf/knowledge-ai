import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'

@SkipAuth()
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
