import { ArgumentsHost, ExceptionFilter, Catch, NotFoundException } from '@nestjs/common'
import {} from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
        if (exception.code === 'P2025') {
            throw new NotFoundException()
        }
        throw exception
    }
}
