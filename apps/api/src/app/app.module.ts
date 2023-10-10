import { applyRawBodyOnlyTo } from '@golevelup/nestjs-webhooks'
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
import { ExpensesModule } from '../expenses/expenses.module'
import { AppConfigModule } from '../config/app-config.module'
import { validationSchema } from '../config/validation.config'
import { DonationsModule } from '../donations/donations.module'
import { BeneficiaryModule } from '../beneficiary/beneficiary.module'
import { KeycloakConfigService } from '../config/keycloak-config.service'
import { PrismaClientExceptionFilter } from '../prisma/prisma-client-exception.filter'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { BenefactorModule } from '../benefactor/benefactor.module'
import { CoordinatorModule } from '../coordinator/coordinator.module'
import { DocumentModule } from '../document/document.module'
import { CountryModule } from '../country/country.module'
import { CompanyModule } from '../company/company.module'
import { InfoRequestModule } from '../info-request/info-request.module'
import { BankAccountModule } from '../bankaccount/bankaccount.module'
import { PersonModule } from '../person/person.module'
import { VaultModule } from '../vault/vault.module'
import { CampaignFileModule } from '../campaign-file/campaign-file.module'
import { WithdrawalModule } from '../withdrawal/withdrawal.module'
import { CampaignTypesModule } from '../campaign-types/campaign-types.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'
import { TransferModule } from '../transfer/transfer.module'
import { IrregularityFileModule } from '../irregularity-file/irregularity-file.module'
import { IrregularityModule } from '../irregularity/irregularity.module'
import { BankTransactionsFileModule } from '../bank-transactions-file/bank-transactions-file.module'
import { OrganizerModule } from '../organizer/organizer.module'
import { DonationWishModule } from '../donation-wish/donation-wish.module'
import { ApiLoggerMiddleware } from './middleware/apilogger.middleware'
import { PaypalModule } from '../paypal/paypal.module'
import { ExportModule } from '../export/export.module'
import { JwtModule } from '@nestjs/jwt'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { ScheduleModule } from '@nestjs/schedule'
import { TasksModule } from '../tasks/tasks.module'
import { BankTransactionsModule } from '../bank-transactions/bank-transactions.module'
import { CacheModule } from '@nestjs/cache-manager'
import { CampaignNewsModule } from '../campaign-news/campaign-news.module'
import { CampaignNewsFileModule } from '../campaign-news-file/campaign-news-file.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { AffiliateModule } from '../affiliate/affiliate.module'

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema, isGlobal: true, load: [configuration] }),
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
    /*Init all background tasks */
    ScheduleModule.forRoot(),
    TasksModule,
    /* Internal modules */
    AuthModule,
    AffiliateModule,
    AccountModule,
    CampaignModule,
    CampaignFileModule,
    CountryModule,
    DonationsModule,
    SupportModule,
    BeneficiaryModule,
    CityModule,
    BenefactorModule,
    HealthModule,
    CoordinatorModule,
    DocumentModule,
    CompanyModule,
    InfoRequestModule,
    BankAccountModule,
    ExpensesModule,
    PersonModule,
    VaultModule,
    WithdrawalModule,
    CampaignTypesModule,
    RecurringDonationModule,
    TransferModule,
    IrregularityFileModule,
    IrregularityModule,
    BankTransactionsFileModule,
    OrganizerModule,
    DonationWishModule,
    PaypalModule,
    ExportModule,
    JwtModule,
    NotificationModule,
    BankTransactionsModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        ttl: Number(config.get<number>('CACHE_TTL', 30 * 1000 /* ms */)),
      }),
      isGlobal: true,
      inject: [ConfigService],
    }),
    CampaignNewsModule,
    CampaignNewsFileModule,
    MarketingNotificationsModule,
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
    applyRawBodyOnlyTo(
      consumer,
      /**
       * Pass raw body for Stripe processing on single endpoint
       * @url https://github.com/golevelup/nestjs/tree/master/packages/webhooks
       */
      {
        path: 'stripe/webhook',
        method: RequestMethod.ALL,
      },
      /**
       * Enabling rawBody for correct paypal webhook verification, by using Stripe middleware.
       * Unfortunately the standard NestJS way didn't work as per these instructions:
       * https://docs.nestjs.com/faq/raw-body
       */
      {
        path: 'paypal/webhook',
        method: RequestMethod.ALL,
      },
    )

    // add HTTP request logging
    consumer.apply(ApiLoggerMiddleware).forRoutes('*')
  }
}
