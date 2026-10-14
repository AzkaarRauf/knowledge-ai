import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { uuidSchema } from 'src/common/schemas/uuid.schema.js'
import { DepartmentsService } from './departments.service.js'
import { CreateDepartmentDto } from './dtos/create-department.dto.js'
import { DepartmentResponseDto } from './dtos/department-response.dto.js'
import { PublicDepartmentResponseDto } from './dtos/public-department-response.dto.js'
import { UpdateDepartmentDto } from './dtos/update-department.dto.js'

@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    @Post()
    @ZodResponse({ type: DepartmentResponseDto, status: 201 })
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto)
    }

    @Get()
    @ZodResponse({ type: [DepartmentResponseDto], status: 200 })
    findAll() {
        return this.departmentsService.findAll()
    }

    // Declared before `:id` so `public` is not matched as an id.
    @Get('public')
    @ZodResponse({ type: [PublicDepartmentResponseDto], status: 200 })
    findAllPublic() {
        return this.departmentsService.findAllPublic()
    }

    @Get(':id')
    @ZodResponse({ type: DepartmentResponseDto, status: 200 })
    findOne(@Param('id', { schema: uuidSchema }) id: string) {
        return this.departmentsService.findOne(id)
    }

    @Patch(':id')
    @ZodResponse({ type: DepartmentResponseDto, status: 200 })
    update(@Param('id', { schema: uuidSchema }) id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto)
    }

    @Delete(':id')
    @ZodResponse({ type: DepartmentResponseDto, status: 200 })
    remove(@Param('id', { schema: uuidSchema }) id: string) {
        return this.departmentsService.remove(id)
    }
}
