import { ForbiddenException } from '@nestjs/common'

export class NotInvitedException extends ForbiddenException {
    constructor() {
        super('Not invited')
    }
}
