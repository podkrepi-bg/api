import { Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProtectedWithHeaderGuard implements CanActivate {
  constructor(private readonly configService:ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get('PG_API_KEY', 'DEFAULT_VALUE')
    const {headers } = context.switchToHttp().getRequest();
 
    return headers['pg-api-key'] === secret
  }
}