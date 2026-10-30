import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { NotInvitedException } from './not-invited.exception.js'
import { Response } from 'express'

@Catch()
export class GoogleOAuthErrorFilter implements ExceptionFilter {
    catch(e: unknown, host: ArgumentsHost) {
        const code = e instanceof NotInvitedException ? 'not_invited' : 'google_failed'
        host.switchToHttp().getResponse<Response>().redirect(`/auth/login?error=${code}`)
    }
}
