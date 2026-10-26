import { Reflector } from '@nestjs/core'
import { Role } from 'src/generated/prisma/enums.js'

type Props = {
    roles: Role[]
    /**
     * @default true
     */
    allowAdmin?: boolean
}

export const UseRoles = Reflector.createDecorator<Props | undefined>({
    transform: (args) => ({ roles: args?.roles ?? [], allowAdmin: args?.allowAdmin ?? true }),
})
