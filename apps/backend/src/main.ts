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

    // the next.js proxy runs on the same host. trust its X-Forwarded-For, so req.ip is the real client ip (rate limiting)
    app.set('trust proxy', 'loopback')

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
