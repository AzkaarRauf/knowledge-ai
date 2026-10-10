import { Module } from '@nestjs/common'
import { UsersService } from './users.service.js'
import { UsersController } from './users.controller.js'
import { HashingModule } from 'src/hashing/hashing.module.js'

@Module({
    controllers: [UsersController],
    providers: [UsersService],
    imports: [HashingModule],
})
export class UsersModule {}
