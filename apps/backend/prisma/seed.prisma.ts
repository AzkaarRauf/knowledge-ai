import { PrismaNeon } from '@prisma/adapter-neon'
import { env } from '../src/env.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { UserCreateInput } from '../src/generated/prisma/models.js'
import { HashingService } from '../src/hashing/hashing.service.js'

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = env
const departments = ['HR', 'IT']

await seed()
async function seed() {
    if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) throw new Error('Required env missing')
    const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL })
    const client = new PrismaClient({ adapter })
    const password = await new HashingService().hash(SEED_ADMIN_PASSWORD)
    const email = SEED_ADMIN_EMAIL
    const name = 'Admin'
    const admin = {
        email,
        name,
        password,
        department: {
            connectOrCreate: { where: { name }, create: { name } },
        },
    } satisfies UserCreateInput

    await client.$connect()
    try {
        await client.user.upsert({
            where: { email },
            update: {},
            create: admin,
        })
        for (const name of departments) {
            await client.department.upsert({ where: { name }, update: {}, create: { name } })
        }
    } finally {
        await client.$disconnect()
    }
}
