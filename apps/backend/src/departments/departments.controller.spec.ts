import { Test, TestingModule } from '@nestjs/testing'
import { DepartmentsController } from './departments.controller.js'
import { DepartmentsService } from './departments.service.js'

const department = {
    id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33',
    name: 'Engineering',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('DepartmentsController', () => {
    let controller: DepartmentsController
    const departmentsService = {
        create: vi.fn(),
        findAll: vi.fn(),
        findAllPublic: vi.fn(),
        findOne: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DepartmentsController],
            providers: [{ provide: DepartmentsService, useValue: departmentsService }],
        }).compile()

        controller = module.get<DepartmentsController>(DepartmentsController)
    })

    it('create delegates to DepartmentsService.create', async () => {
        departmentsService.create.mockResolvedValue(department)

        await expect(controller.create({ name: 'Engineering' })).resolves.toEqual(department)
        expect(departmentsService.create).toHaveBeenCalledWith({ name: 'Engineering' })
    })

    it('findAll delegates to DepartmentsService.findAll', async () => {
        departmentsService.findAll.mockResolvedValue([department])

        await expect(controller.findAll()).resolves.toEqual([department])
    })

    it('findAllPublic delegates to DepartmentsService.findAllPublic', async () => {
        const publicDepartments = [{ id: department.id, name: department.name }]
        departmentsService.findAllPublic.mockResolvedValue(publicDepartments)

        await expect(controller.findAllPublic()).resolves.toEqual(publicDepartments)
    })

    it('findOne delegates to DepartmentsService.findOne', async () => {
        departmentsService.findOne.mockResolvedValue(department)

        await expect(controller.findOne(department.id)).resolves.toEqual(department)
        expect(departmentsService.findOne).toHaveBeenCalledWith(department.id)
    })

    it('update delegates to DepartmentsService.update', async () => {
        departmentsService.update.mockResolvedValue(department)

        await expect(controller.update(department.id, { name: 'Engineering' })).resolves.toEqual(department)
        expect(departmentsService.update).toHaveBeenCalledWith(department.id, {
            name: 'Engineering',
        })
    })

    it('remove delegates to DepartmentsService.remove', async () => {
        departmentsService.remove.mockResolvedValue(department)

        await expect(controller.remove(department.id)).resolves.toEqual(department)
        expect(departmentsService.remove).toHaveBeenCalledWith(department.id)
    })
})
