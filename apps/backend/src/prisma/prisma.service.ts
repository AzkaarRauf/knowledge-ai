import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createPrismaAdapter } from 'src/common/utils/prisma.utils.js'
import { PrismaClient } from '../generated/prisma/client.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter = createPrismaAdapter()
        super({ adapter })
    }

    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }
}
