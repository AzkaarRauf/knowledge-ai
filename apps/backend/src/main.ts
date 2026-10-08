import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { env } from './env.js'
import { VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    })

    // Swagger if dev env
    if (env.ENV === 'dev') {
        const config = new DocumentBuilder().build()
        const documentFactory = () => SwaggerModule.createDocument(app, config)
        SwaggerModule.setup('docs', app, documentFactory)
    }

    await app.listen(env.PORT ?? 8090)
}
await bootstrap()
