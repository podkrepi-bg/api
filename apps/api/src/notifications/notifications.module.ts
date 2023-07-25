import { Module } from '@nestjs/common'
import { SendGridNotificationsService } from './notifications.sendgrid.service'
import { NotificationsInterface } from './notifications.interface'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      // Use the interface as token
      provide: NotificationsInterface,
      // But actually provide the service that implements the interface
      useClass: SendGridNotificationsService,
    },
  ],
  exports: [
    {
      provide: NotificationsInterface,
      useClass: SendGridNotificationsService,
    },
  ],
})
export class MarketingNotificationsModule {}
