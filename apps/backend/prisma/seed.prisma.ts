import { PrismaNeon } from '@prisma/adapter-neon'
import { env } from '../src/env.js'
import { PrismaClient, Role } from '../src/generated/prisma/client.js'
import { UserCreateInput } from '../src/generated/prisma/models.js'

const { SEED_ADMIN_EMAIL } = env
const departments = ['HR', 'IT']

await seed()
async function seed() {
    if (!SEED_ADMIN_EMAIL) throw new Error('Required env missing')
    const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL })
    const client = new PrismaClient({ adapter })
    const email = SEED_ADMIN_EMAIL
    const name = 'Admin'
    // no password: the admin claims this account on first google sign-in (matched by email)
    const admin = {
        email,
        name,
        role: Role.ADMIN,
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
