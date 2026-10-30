import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-google-oauth20'
import { env } from 'src/env.js'

export type GoogleUser = { googleId: string; email: string; emailVerified: boolean; name: string; hd?: string }

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_REDIRECT_URI,
            scope: ['openid', 'email', 'profile'],
        })
    }

    validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleUser {
        const json = profile._json
        return {
            email: json.email ?? '',
            emailVerified: String(json.email_verified) === 'true',
            googleId: profile.id,
            name: profile.displayName,
            hd: json.hd,
        }
    }
}
