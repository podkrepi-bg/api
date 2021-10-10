import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry'
import { KeycloakConnectModule, ResourceGuard, RoleGuard, AuthGuard } from 'nest-keycloak-connect'

import { AppService } from './app.service'
import { AuthModule } from '../auth/auth.module'
import { CityModule } from '../city/city.module'
import { AppController } from './app.controller'
import configuration from '../config/configuration'
import { PrismaService } from '../prisma/prisma.service'
import { AccountModule } from '../account/account.module'
import { HealthModule } from '../health/health.module'
import { SupportModule } from '../support/support.module'
import { CampaignModule } from '../campaign/campaign.module'
import { AppConfigModule } from '../config/app-config.module'
import { validationSchema } from '../config/validation.config'
import { BeneficiaryModule } from '../beneficiary/beneficiary.module'
import { KeycloakConfigService } from '../config/keycloak-config.service'
import { PrismaClientExceptionFilter } from '../prisma/prisma-client-exception.filter'

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema, isGlobal: true, load: [configuration] }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => config.get('sentry', {}),
      inject: [ConfigService],
    }),
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AppConfigModule],
    }),
    AuthModule,
    AccountModule,
    CampaignModule,
    SupportModule,
    BeneficiaryModule,
    CityModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new SentryInterceptor(),
    },
    // Will return a 401 unauthorized when it is unable to
    // verify the JWT token or Bearer header is missing.
    { provide: APP_GUARD, useClass: AuthGuard },
    // This adds a global level resource guard, which is permissive.
    // Only controllers annotated with @Resource and methods with @Scopes
    // are handled by this guard.
    { provide: APP_GUARD, useClass: ResourceGuard },
    // This adds a global level role guard, which is permissive.
    // Used by `@Roles` decorator with the optional `@AllowAnyRole` decorator for allowing any
    // specified role passed.
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
