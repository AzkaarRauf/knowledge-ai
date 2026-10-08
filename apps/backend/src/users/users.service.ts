import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'

@Injectable()
export class UsersService {
    constructor(private db: PrismaService) {}

    async create(createUserDto: CreateUserDto) {
        // TODO hash password
        const user = await this.db.user.create({ data: createUserDto })
        return user
    }

    async findAll() {
        const users = await this.db.user.findMany()
        return users
    }

    async findOne(id: string) {
        const user = await this.db.user.findFirstOrThrow({ where: { id } })
        return user
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`
    }

    remove(id: number) {
        return `This action removes a #${id} user`
    }
}
