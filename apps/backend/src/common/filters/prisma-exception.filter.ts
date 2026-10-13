import {
    ArgumentsHost,
    ExceptionFilter,
    Catch,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common'
import {} from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private logger = new Logger(PrismaExceptionFilter.name)
    catch(exception: PrismaClientKnownRequestError, _host: ArgumentsHost) {
        if (exception.code === 'P2025') {
            throw new NotFoundException()
        }
        if (exception.code === 'P2002') {
            throw new ConflictException()
        }
        this.logger.error(exception)
        throw new InternalServerErrorException()
    }
}
