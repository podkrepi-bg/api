import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'

import { KeycloakConfigService } from './keycloak-config.service'

@Module({
  providers: [
    {
      provide: KeycloakConfigService,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return new KeycloakConfigService(
          config.get<string>('keycloak.serverUrl'),
          config.get<string>('keycloak.realm'),
          config.get<string>('keycloak.clientId'),
          config.get<string>('keycloak.secret'),
        )
      },
    },
    {
      provide: KeycloakAdminClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new KeycloakAdminClient({
          baseUrl: config.get<string>('keycloak.serverUrl'),
          realmName: config.get<string>('keycloak.realm'),
        })
      },
    },
  ],
  exports: [KeycloakConfigService, KeycloakAdminClient],
})
export class AppConfigModule {}
