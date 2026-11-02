import { ArgumentsHost, ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { PrismaExceptionFilter } from './prisma-exception.filter.js'

const prismaError = (code: string, meta?: Record<string, unknown>) =>
    new PrismaClientKnownRequestError('db error', { code, clientVersion: 'test', meta })

describe('PrismaExceptionFilter', () => {
    const filter = new PrismaExceptionFilter()
    const host = {} as ArgumentsHost
    const run = (e: PrismaClientKnownRequestError) => () => filter.catch(e, host)

    beforeEach(() => {
        vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
    })

    it('maps P2025 to NotFoundException', () => {
        expect(run(prismaError('P2025'))).toThrow(NotFoundException)
    })

    it('names the model and fields from driver adapter meta on P2002', () => {
        const meta = {
            modelName: 'Department',
            driverAdapterError: { cause: { kind: 'UniqueConstraintViolation', constraint: { fields: ['name'] } } },
        }
        expect(run(prismaError('P2002', meta))).toThrow(new ConflictException('Department name is already taken'))
    })

    it('names the fields from meta.target on P2002', () => {
        expect(run(prismaError('P2002', { target: ['email'] }))).toThrow(new ConflictException('email is already taken'))
    })

    it('falls back to a plain conflict when P2002 meta has no fields', () => {
        expect(run(prismaError('P2002'))).toThrow(new ConflictException())
    })

    it('maps other codes to InternalServerErrorException', () => {
        expect(run(prismaError('P2003'))).toThrow(InternalServerErrorException)
    })
})
