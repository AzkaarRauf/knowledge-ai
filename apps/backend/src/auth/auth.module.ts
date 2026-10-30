import { Module } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { env } from 'src/env.js'
import { JwtModule } from '@nestjs/jwt'
import { ACCESS_TOKEN_DURATION } from './auth.constants.js'
import { PassportModule } from '@nestjs/passport'
import { GoogleStrategy } from './google/google.strategy.js'

@Module({
    controllers: [AuthController],
    providers: [AuthService, GoogleStrategy],
    imports: [
        PassportModule,
        JwtModule.register({
            secret: env.JWT_SECRET,
            global: true,
            signOptions: {
                expiresIn: ACCESS_TOKEN_DURATION / 1000,
            },
        }),
    ],
})
export class AuthModule {}
