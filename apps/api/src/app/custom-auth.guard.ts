import { AuthGuard } from "nest-keycloak-connect";
import { ExecutionContext, Logger } from "@nestjs/common";
import { extractRequest } from "nest-keycloak-connect/util";

export class CustomAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [request] = extractRequest(context);
    // Skip auth guard for Stripe routes and pseudo requests
    if (request.url === "/api/stripe/webhook" || request.object === "event") {
      Logger.warn("Skip AuthGuard", CustomAuthGuard.name);
      return true;
    }
    return super.canActivate(context);
  }
}
