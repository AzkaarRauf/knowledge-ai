import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'

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
