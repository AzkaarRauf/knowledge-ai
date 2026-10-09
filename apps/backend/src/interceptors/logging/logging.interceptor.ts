import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { catchError, finalize, Observable, tap, throwError } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name)
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>()
        const res = context.switchToHttp().getResponse<Response>()
        const start = Date.now()

        this.logger.log(`[${req.id}] --> ${req.method} ${req.originalUrl}`)

        res.on('finish', () => {
            const duration = Date.now() - start

            const message = `[${req.id}] <-- ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`

            if (res.statusCode >= 200 && res.statusCode < 300) {
                this.logger.log(message)
            } else {
                this.logger.error(message)
            }
        })

        return next.handle()
    }
}
