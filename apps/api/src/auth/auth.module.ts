import { Module } from '@nestjs/common'
import { KeycloakConnectModule } from 'nest-keycloak-connect'

import { AuthService } from './auth.service'
import { LoginController } from './login.controller'
import { RegisterController } from './register.controller'
import { AppConfigModule } from '../config/app-config.module'
import { KeycloakConfigService } from '../config/keycloak-config.service'
import { RefreshController } from './refresh.controller'
import { HttpModule } from '@nestjs/axios'
import { ProviderLoginController } from './provider-login.controller'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { CompanyModule } from '../company/company.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    AppConfigModule,
    HttpModule,
    JwtModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AppConfigModule],
    }),
    MarketingNotificationsModule,
    CompanyModule,
    PrismaModule,
  ],
  controllers: [LoginController, RegisterController, RefreshController, ProviderLoginController],
  providers: [AuthService, EmailService, JwtService, TemplateService],
  exports: [AuthService],
})
export class AuthModule {}
