import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { isError, safe } from 'shared'
import { JwtPayloadDto, jwtPayloadSchema } from 'src/common/dtos/jwt-payload.dto.js'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'

declare global {
    namespace Express {
        interface Request {
            jwtPayload?: JwtPayloadDto
        }
    }
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (
            this.reflector.getAllAndOverride(SkipAuth, [context.getHandler(), context.getClass()])
        ) {
            return true
        }

        const request = context.switchToHttp().getRequest<Request>()

        const authHeader = request.headers.authorization?.split(' ')
        if (!authHeader) throw new UnauthorizedException()

        const [type, token] = authHeader
        if (type !== 'Bearer') throw new UnauthorizedException()

        const raw = await safe(this.jwtService.verifyAsync<JwtPayloadDto>(token))
        if (isError(raw)) throw new UnauthorizedException()
        const payload = jwtPayloadSchema.safeParse(raw)
        if (!payload.success) throw new UnauthorizedException()
        request.jwtPayload = payload.data

        return true
    }
}
