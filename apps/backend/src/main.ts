import { cleanupOpenApiDoc } from 'nestjs-zod'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { env } from './env.js'
import { StandardSchemaValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const openApiDoc = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Example API')
            .setDescription('Example API description')
            .setVersion('1.0')
            .build(),
    )

    SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc))

    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    })

    app.enableShutdownHooks()

    app.useGlobalPipes(
        new StandardSchemaValidationPipe({ transform: true, validateCustomDecorators: true }),
    )

    app.useGlobalFilters(new PrismaExceptionFilter())

    // Swagger if dev env
    if (env.ENV === 'dev') {
        const config = new DocumentBuilder().build()
        const documentFactory = () => SwaggerModule.createDocument(app, config)
        SwaggerModule.setup('docs', app, documentFactory)
    }

    await app.listen(env.PORT ?? 8090)
}
await bootstrap()
