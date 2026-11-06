import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { SqlDriverAdapterFactory } from '@prisma/client/runtime/client'
import { env } from 'src/env.js'

type PoolConfig = ConstructorParameters<typeof PrismaNeon>[0]

export function createPrismaAdapter() {
    let adapter: SqlDriverAdapterFactory
    const config: PoolConfig = { connectionString: env.DATABASE_URL }
    switch (env.PRISMA_PROVIDER) {
        case 'local':
            adapter = new PrismaPg(config)
            break
        case 'neon':
            adapter = new PrismaNeon(config)
            break
    }
    return adapter
}
