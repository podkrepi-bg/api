import { Module } from '@nestjs/common'
import { LoginController } from './login.controller'
import { RegisterController } from './register.controller'
import { AuthService } from './auth.service'

@Module({
  controllers: [LoginController, RegisterController],
  providers: [AuthService],
})
export class AuthModule {}
