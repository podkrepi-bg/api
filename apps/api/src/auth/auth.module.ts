import { Module } from '@nestjs/common'
import { KeycloakConnectModule } from 'nest-keycloak-connect'

import { AuthService } from './auth.service'
import { LoginController } from './login.controller'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterController } from './register.controller'
import { AppConfigModule } from '../config/app-config.module'
import { KeycloakConfigService } from '../config/keycloak-config.service'
import { RefreshController } from './refresh.controller'
import { HttpModule } from '@nestjs/axios'
import { ProviderLoginController } from './provider-login.controller'
import { JwtService } from '@nestjs/jwt'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

@Module({
  controllers: [LoginController, RegisterController, RefreshController, ProviderLoginController],
  providers: [AuthService, PrismaService, EmailService, JwtService, TemplateService],
  imports: [
    AppConfigModule,
    HttpModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AppConfigModule],
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
