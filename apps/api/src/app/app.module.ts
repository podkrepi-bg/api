import {
  JsonBodyMiddleware,
  RawBodyMiddleware,
  applyRawBodyOnlyTo,
} from '@golevelup/nestjs-webhooks'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry'
import { KeycloakConnectModule, RoleGuard } from 'nest-keycloak-connect'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'

import { AppService } from './app.service'
import { AuthModule } from '../auth/auth.module'
import { CityModule } from '../city/city.module'
import { AppController } from './app.controller'
import { CustomAuthGuard } from './custom-auth.guard'
import configuration from '../config/configuration'
import { PrismaService } from '../prisma/prisma.service'
import { AccountModule } from '../account/account.module'
import { HealthModule } from '../health/health.module'
import { SupportModule } from '../support/support.module'
import { CampaignModule } from '../campaign/campaign.module'
import { AppConfigModule } from '../config/app-config.module'
import { validationSchema } from '../config/validation.config'
import { DonationsModule } from '../donations/donations.module'
import { BeneficiaryModule } from '../beneficiary/beneficiary.module'
import { KeycloakConfigService } from '../config/keycloak-config.service'
import { PrismaClientExceptionFilter } from '../prisma/prisma-client-exception.filter'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { CatModule } from '../cat/cat.module'
@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema, isGlobal: true, load: [configuration] }),
    /* Middlewares */
    JsonBodyMiddleware,
    RawBodyMiddleware,
    /* External modules */
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('sentry', {}),
    }),
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AppConfigModule],
    }),
    /* Internal modules */
    AuthModule,
    AccountModule,
    CampaignModule,
    DonationsModule,
    SupportModule,
    BeneficiaryModule,
    CityModule,
    CatModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    EmailService,
    TemplateService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new SentryInterceptor(),
    },
    /**
     * Will return a 401 unauthorized when it is unable to
     * verify the JWT token or Bearer header is missing.
     */
    { provide: APP_GUARD, useClass: CustomAuthGuard },
    /**
     * This adds a global level resource guard, which is permissive.
     * Only controllers annotated with @Resource and methods with @Scopes
     * are handled by this guard.
     */
    // { provide: APP_GUARD, useClass: ResourceGuard },
    /**
     * This adds a global level role guard, which is permissive.
     * Used by @Roles decorator with the optional @AllowAnyRole decorator for allowing any
     * specified role passed.
     */
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    /**
     * Pass raw body for Stripe processing on single endpoint
     * @url https://github.com/golevelup/nestjs/tree/master/packages/webhooks
     */
    applyRawBodyOnlyTo(consumer, {
      method: RequestMethod.ALL,
      path: 'stripe/webhook',
    })
  }
}
