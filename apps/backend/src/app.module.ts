import { ZodValidationPipe, ZodSerializerInterceptor, ZodSerializationException } from 'nestjs-zod'
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, BaseExceptionFilter } from '@nestjs/core'
import { ZodError } from 'zod'
import { Module, HttpException, ArgumentsHost, Logger, Catch } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { HealthModule } from './health/health.module.js'
import { PrismaService } from './prisma/prisma.service.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { UsersModule } from './users/users.module.js'

@Catch(HttpException)
class HttpExceptionFilter extends BaseExceptionFilter {
    private logger = new Logger(HttpExceptionFilter.name)

    catch(exception: HttpException, host: ArgumentsHost) {
        if (exception instanceof ZodSerializationException) {
            const zodError = exception.getZodError()

            if (zodError instanceof ZodError) {
                this.logger.error(`ZodSerializationException: ${zodError.message}`)
            }
        }

        super.catch(exception, host)
    }
}

@Module({
    imports: [HealthModule, PrismaModule, UsersModule],
    controllers: [AppController],
    providers: [
        AppService,
        PrismaService,
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule {}
