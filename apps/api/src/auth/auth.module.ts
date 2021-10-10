import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginController } from './login.controller'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterController } from './register.controller'
import { AppConfigModule } from '../config/app-config.module'

@Module({
  controllers: [LoginController, RegisterController],
  providers: [AuthService, PrismaService],
  imports: [AppConfigModule],
})
export class AuthModule {}
