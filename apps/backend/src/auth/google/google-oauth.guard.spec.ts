import { GoogleOAuthGuard } from './google-oauth.guard.js'

describe('GoogleOauthGuard', () => {
    it('should be defined', () => {
        expect(new GoogleOAuthGuard()).toBeDefined()
    })
})
