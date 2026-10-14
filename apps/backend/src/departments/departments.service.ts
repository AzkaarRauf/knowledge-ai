import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CreateDepartmentDto } from './dtos/create-department.dto.js'
import { DepartmentResponseDto } from './dtos/department-response.dto.js'
import { PublicDepartmentResponseDto } from './dtos/public-department-response.dto.js'
import { UpdateDepartmentDto } from './dtos/update-department.dto.js'

/** Seeded with the admin user; never offered to the public. */
export const ADMIN_DEPARTMENT_NAME = 'Admin'

@Injectable()
export class DepartmentsService {
    constructor(private db: PrismaService) {}

    async create(createDepartmentDto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
        await this.assertNameAvailable(createDepartmentDto.name)
        return this.db.department.create({ data: createDepartmentDto })
    }

    findAll(): Promise<DepartmentResponseDto[]> {
        return this.db.department.findMany({ orderBy: { name: 'asc' } })
    }

    findAllPublic(): Promise<PublicDepartmentResponseDto[]> {
        return this.db.department.findMany({
            where: { name: { not: ADMIN_DEPARTMENT_NAME } },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    findOne(id: string): Promise<DepartmentResponseDto> {
        return this.db.department.findUniqueOrThrow({ where: { id } })
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<DepartmentResponseDto> {
        if (updateDepartmentDto.name) await this.assertNameAvailable(updateDepartmentDto.name, id)
        return this.db.department.update({ where: { id }, data: updateDepartmentDto })
    }

    async remove(id: string): Promise<DepartmentResponseDto> {
        const userCount = await this.db.user.count({ where: { departmentId: id } })
        if (userCount > 0) {
            throw new ConflictException('Department still has users and cannot be deleted')
        }
        return this.db.department.delete({ where: { id } })
    }

    private async assertNameAvailable(name: string, excludeId?: string) {
        const existing = await this.db.department.findUnique({ where: { name } })
        if (existing && existing.id !== excludeId) {
            throw new ConflictException('Department name is already taken')
        }
    }
}
