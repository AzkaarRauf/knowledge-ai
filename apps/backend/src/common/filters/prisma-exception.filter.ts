import {
    ArgumentsHost,
    ExceptionFilter,
    Catch,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private logger = new Logger(PrismaExceptionFilter.name)
    catch(exception: PrismaClientKnownRequestError, _host: ArgumentsHost) {
        if (exception.code === 'P2025') {
            throw new NotFoundException()
        }
        if (exception.code === 'P2002') {
            throw new ConflictException(uniqueViolationMessage(exception.meta))
        }
        this.logger.error(exception)
        throw new InternalServerErrorException()
    }
}

// builds e.g. "Department name is already taken" from P2002 meta
function uniqueViolationMessage(meta: Record<string, unknown> | undefined) {
    const fields = uniqueViolationFields(meta)
    if (fields.length === 0) return undefined
    const model = typeof meta?.modelName === 'string' ? `${meta.modelName} ` : ''
    return `${model}${fields.join(', ')} is already taken`
}

// fields are in meta.target (rust engine) or under driverAdapterError (driver adapters)
function uniqueViolationFields(meta: Record<string, unknown> | undefined): string[] {
    if (Array.isArray(meta?.target)) return meta.target.filter((f) => typeof f === 'string')
    const adapterError = meta?.driverAdapterError as { cause?: { constraint?: { fields?: unknown } } } | undefined
    const fields = adapterError?.cause?.constraint?.fields
    return Array.isArray(fields) ? fields.filter((f) => typeof f === 'string') : []
}
