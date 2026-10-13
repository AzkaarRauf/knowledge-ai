import { createParamDecorator, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'

export const JwtPayload = createParamDecorator((_, context) => {
    const request = context.switchToHttp().getRequest<Request>()
    const { jwtPayload } = request
    if (!jwtPayload) throw new UnauthorizedException()
    return jwtPayload
})
