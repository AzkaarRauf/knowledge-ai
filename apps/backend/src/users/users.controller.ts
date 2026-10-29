import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { uuidSchema } from 'src/common/schemas/uuid.schema.js'
import { Role } from 'src/generated/prisma/enums.js'
import { UseRoles } from 'src/role/use-roles.decorator.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { UserResponseDto } from './dto/user-response.dto.js'
import { UsersService } from './users.service.js'

@UseRoles({ roles: [Role.ADMIN] })
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ZodResponse({ type: UserResponseDto, status: 201 })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto)
    }

    @Get()
    @ZodResponse({ type: [UserResponseDto], status: 200 })
    findAll() {
        return this.usersService.findAll()
    }

    @Get(':id')
    @ZodResponse({ type: UserResponseDto, status: 200 })
    findOne(@Param('id', { schema: uuidSchema }) id: string) {
        return this.usersService.findOne(id)
    }

    @Patch(':id')
    @ZodResponse({ type: UserResponseDto, status: 200 })
    update(@Param('id', { schema: uuidSchema }) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto)
    }
}
