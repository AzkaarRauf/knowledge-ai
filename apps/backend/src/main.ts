import { cleanupOpenApiDoc } from 'nestjs-zod'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { env } from './env.js'
import { StandardSchemaValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { type NestExpressApplication } from '@nestjs/platform-express'
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    // trust the proxy X-Forwarded-For, so req.ip is the real client ip (rate limiting)
    // local: next.js proxy on same host, so 'loopback'. Render behind Vercel: set TRUST_PROXY=2 (Render proxy + Vercel)
    app.set('trust proxy', env.TRUST_PROXY)

    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    })

    app.enableShutdownHooks()

    app.useGlobalPipes(new StandardSchemaValidationPipe({ transform: true, validateCustomDecorators: true }))

    app.useGlobalFilters(new PrismaExceptionFilter())

    // Swagger if dev env
    if (env.ENV === 'dev') {
        const config = new DocumentBuilder().addBearerAuth().build()
        const documentFactory = () => cleanupOpenApiDoc(SwaggerModule.createDocument(app, config))
        SwaggerModule.setup('docs', app, documentFactory)
    }

    await app.listen(env.PORT ?? 8090)
}
await bootstrap()
