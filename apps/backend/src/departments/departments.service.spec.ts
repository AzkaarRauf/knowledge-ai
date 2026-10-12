import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { DepartmentsService } from './departments.service.js'

const department = {
    id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33',
    name: 'Engineering',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('DepartmentsService', () => {
    let service: DepartmentsService
    const db = {
        department: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: { count: vi.fn() },
    }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [DepartmentsService, { provide: PrismaService, useValue: db }],
        }).compile()

        service = module.get<DepartmentsService>(DepartmentsService)
    })

    describe('create', () => {
        it('creates the department when the name is free', async () => {
            db.department.findUnique.mockResolvedValue(null)
            db.department.create.mockResolvedValue(department)

            await expect(service.create({ name: 'Engineering' })).resolves.toEqual(department)
            expect(db.department.create).toHaveBeenCalledWith({ data: { name: 'Engineering' } })
        })

        it('throws ConflictException when the name is taken', async () => {
            db.department.findUnique.mockResolvedValue(department)

            await expect(service.create({ name: 'Engineering' })).rejects.toThrow(
                new ConflictException('Department name is already taken'),
            )
            expect(db.department.create).not.toHaveBeenCalled()
        })
    })

    describe('findAll', () => {
        it('returns departments ordered by name', async () => {
            db.department.findMany.mockResolvedValue([department])

            await expect(service.findAll()).resolves.toEqual([department])
            expect(db.department.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
        })
    })

    describe('findAllPublic', () => {
        it('returns id and name only, without the admin department', async () => {
            db.department.findMany.mockResolvedValue([{ id: department.id, name: department.name }])

            await expect(service.findAllPublic()).resolves.toEqual([
                { id: department.id, name: department.name },
            ])
            expect(db.department.findMany).toHaveBeenCalledWith({
                where: { name: { not: 'Admin' } },
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            })
        })
    })

    describe('findOne', () => {
        it('looks the department up by id', async () => {
            db.department.findUniqueOrThrow.mockResolvedValue(department)

            await expect(service.findOne(department.id)).resolves.toEqual(department)
            expect(db.department.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: department.id },
            })
        })
    })

    describe('update', () => {
        it('allows keeping the same name', async () => {
            db.department.findUnique.mockResolvedValue(department)
            db.department.update.mockResolvedValue(department)

            await expect(service.update(department.id, { name: 'Engineering' })).resolves.toEqual(
                department,
            )
            expect(db.department.update).toHaveBeenCalledWith({
                where: { id: department.id },
                data: { name: 'Engineering' },
            })
        })

        it('throws ConflictException when another department has the name', async () => {
            db.department.findUnique.mockResolvedValue({ ...department, id: 'other-id' })

            await expect(service.update(department.id, { name: 'Engineering' })).rejects.toThrow(
                new ConflictException('Department name is already taken'),
            )
            expect(db.department.update).not.toHaveBeenCalled()
        })
    })

    describe('remove', () => {
        it('deletes a department with no users', async () => {
            db.user.count.mockResolvedValue(0)
            db.department.delete.mockResolvedValue(department)

            await expect(service.remove(department.id)).resolves.toEqual(department)
            expect(db.department.delete).toHaveBeenCalledWith({ where: { id: department.id } })
        })

        it('throws ConflictException when users still belong to it', async () => {
            db.user.count.mockResolvedValue(2)

            await expect(service.remove(department.id)).rejects.toThrow(
                new ConflictException('Department still has users and cannot be deleted'),
            )
            expect(db.department.delete).not.toHaveBeenCalled()
        })
    })
})
