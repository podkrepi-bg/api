import { Injectable } from '@nestjs/common'
import {
  KeycloakConnectOptions,
  KeycloakConnectOptionsFactory,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect'

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
  constructor(
    private readonly serverUrl?: string,
    private readonly realm?: string,
    private readonly clientId?: string,
    private readonly secret?: string,
  ) {}
  createKeycloakConnectOptions(): KeycloakConnectOptions {
    return {
      authServerUrl: this.serverUrl,
      realm: this.realm ?? "",
      clientId: this.clientId,
      secret: this.secret ?? "",
      bearerOnly: true,
      useNestLogger: true,
      cookieKey: 'KEYCLOAK_JWT',
      logLevels: ['warn', 'verbose', 'log', 'error', 'debug'],
      policyEnforcement: PolicyEnforcementMode.ENFORCING,
      tokenValidation: TokenValidation.ONLINE,
    }
  }
}
