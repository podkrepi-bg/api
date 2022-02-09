import { INestApplication } from '@nestjs/common'

export function setupCors(app: INestApplication): void {
  app.enableCors({
    origin: true,
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
    maxAge: 2 * 60 * 60,
  })
}
