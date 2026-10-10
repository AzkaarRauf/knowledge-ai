import { Module } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { HashingModule } from 'src/hashing/hashing.module.js'
import { env } from 'src/env.js'
import { JwtModule } from '@nestjs/jwt'

@Module({
    controllers: [AuthController],
    providers: [AuthService],
    imports: [
        HashingModule,
        JwtModule.register({
            secret: env.JWT_SECRET,
            global: true,
            signOptions: {
                expiresIn: '1d',
            },
        }),
    ],
})
export class AuthModule {}
