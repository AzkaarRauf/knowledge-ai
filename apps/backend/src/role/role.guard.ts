import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { UseRoles } from './use-roles.decorator.js'
import { Request } from 'express'
import { Role } from 'src/generated/prisma/enums.js'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        if (this.reflector.getAllAndOverride(SkipAuth, [context.getHandler(), context.getClass()])) {
            return true
        }
        const req = context.switchToHttp().getRequest<Request>()
        const role = req.jwtPayload?.role
        if (!role) throw new UnauthorizedException()

        const args = this.reflector.getAllAndOverride(UseRoles, [context.getHandler(), context.getClass()])
        const { roles = [], allowAdmin = true } = args ?? {}
        if (allowAdmin && role === Role.ADMIN) return true
        return roles.some((item) => item === role)
    }
}
