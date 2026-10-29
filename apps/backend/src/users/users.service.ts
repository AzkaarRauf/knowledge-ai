import { Injectable } from '@nestjs/common'
import { HashingService } from 'src/hashing/hashing.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { UserResponseDto } from './dto/user-response.dto.js'

// never select the password hash
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    departmentId: true,
    department: { select: { id: true, name: true } },
    createdAt: true,
    updatedAt: true,
} as const

@Injectable()
export class UsersService {
    constructor(
        private db: PrismaService,
        private hashingService: HashingService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const password = await this.hashingService.hash(createUserDto.password)
        return this.db.user.create({ data: { ...createUserDto, password }, select: userSelect })
    }

    findAll(): Promise<UserResponseDto[]> {
        return this.db.user.findMany({ select: userSelect, orderBy: { name: 'asc' } })
    }

    findOne(id: string): Promise<UserResponseDto> {
        return this.db.user.findUniqueOrThrow({ where: { id }, select: userSelect })
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        return this.db.user.update({ where: { id }, data: updateUserDto, select: userSelect })
    }
}
