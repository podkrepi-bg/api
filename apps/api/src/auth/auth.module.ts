import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginController } from './login.controller'
import { RegisterController } from './register.controller'
import { AppConfigModule } from '../config/app-config.module'

@Module({
  controllers: [LoginController, RegisterController],
  providers: [AuthService],
  imports: [AppConfigModule],
})
export class AuthModule {}
