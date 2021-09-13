import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Podkrepi.bg API')
    .setDescription('Backend API of charity platform Podkrepi.bg')
    .setVersion('0.1')
    .setContact('Podkrepi.bg', 'https://podkrepi.bg', 'team@podkrepi.bg')
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      controllerKey.replace(/controller/gi, '') + '.' + methodKey,
    ignoreGlobalPrefix: false,
  })
  SwaggerModule.setup('docs', app, document)
}
