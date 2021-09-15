import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { KeycloakConnectModule, ResourceGuard, RoleGuard, AuthGuard } from 'nest-keycloak-connect'

import { AppService } from './app.service'
import { CityModule } from '../city/city.module'
import { AppController } from './app.controller'
import configuration from '../config/configuration'
import { PrismaService } from '../prisma/prisma.service'
import { AccountModule } from '../account/account.module'
import { SupportModule } from '../support/support.module'
import { CampaignModule } from '../campaign/campaign.module'
import { AppConfigModule } from '../config/app-config.module'
import { validationSchema } from '../config/validation.config'
import { KeycloakConfigService } from '../config/keycloak-config.service'

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema, isGlobal: true, load: [configuration] }),
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AppConfigModule],
    }),
    AccountModule,
    CampaignModule,
    SupportModule,
    CityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
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
