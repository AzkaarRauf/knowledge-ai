import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { getRequestCookie } from '@nestjs/core/helpers/cookies/request-cookies.js'
import { AuthGuard } from '@nestjs/passport'
import { createHash, randomBytes } from 'crypto'
import { Request, Response } from 'express'
import { AuthenticateOptionsGoogle } from 'passport-google-oauth20'
import { Observable } from 'rxjs'

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') implements CanActivate {
    private readonly STATE_COOKIE_NAME = 'oauth_state'

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest<Request>()
        if (this.isCallback(req)) {
            const secret = getRequestCookie(req, this.STATE_COOKIE_NAME)
            const res = context.switchToHttp().getResponse<Response>()
            res.clearCookie(this.STATE_COOKIE_NAME)
            if (!secret || req.query.state !== this.sha256(secret)) throw new UnauthorizedException('Bad OAuth state')
        }
        return super.canActivate(context)
    }

    getAuthenticateOptions(context: ExecutionContext): AuthenticateOptionsGoogle {
        const req = context.switchToHttp().getRequest<Request>()
        if (this.isCallback(req)) return { session: false }

        const secret = randomBytes(32).toString('base64url')
        const res = context.switchToHttp().getResponse<Response>()
        res.cookie(this.STATE_COOKIE_NAME, secret, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000, // 10 min,
        })
        return {
            session: false,
            state: this.sha256(secret),
            prompt: 'select_account', // Always show the account picker.
        }
    }

    private isCallback(req: Request) {
        return 'code' in req.query || 'error' in req.query
    }
    private sha256(s: string) {
        return createHash('sha256').update(s).digest('base64url')
    }
}
