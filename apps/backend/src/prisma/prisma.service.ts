import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'
import { env } from 'src/env.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL })
        super({ adapter })
    }

    async onModuleInit() {
        this.$connect()
    }

    async onModuleDestroy() {
        this.$disconnect()
    }
}
