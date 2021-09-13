import { INestApplication, ValidationPipe } from '@nestjs/common'

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )
}
