import {
    ArgumentsHost,
    Catch,
    HttpException,
    Logger,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, BaseExceptionFilter } from '@nestjs/core'
import { ZodSerializationException, ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthModule } from './auth/auth.module.js'
import { DepartmentsModule } from './departments/departments.module.js'
import { HashingModule } from './hashing/hashing.module.js'
import { HealthModule } from './health/health.module.js'
import { LoggingInterceptor } from './interceptors/logging/logging.interceptor.js'
import { RequestIdMiddleware } from './middlewares/request-id/request-id.middleware.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { PrismaService } from './prisma/prisma.service.js'
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
    imports: [
        AuthModule,
        DepartmentsModule,
        HealthModule,
        PrismaModule,
        UsersModule,
        HashingModule,
    ],
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
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIdMiddleware).forRoutes('*')
    }
}
