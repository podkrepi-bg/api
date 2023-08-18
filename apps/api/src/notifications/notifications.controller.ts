import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import {
  SendConfirmationDto,
  SubscribeDto,
  SubscribePublicDto,
  UnsubscribeDto,
  UnsubscribePublicDto,
} from './dto/subscribe.dto'

import { MarketingNotificationsService } from './notifications.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

@ApiTags('notifications')
@Controller('notifications')
export class MarketingNotificationsController {
  constructor(private readonly marketingNotificationsService: MarketingNotificationsService) {}

  //   Sends confirmation mail to non-registered email address
  @Post('send-confirm-email')
  @Public()
  async sendConfirmation(@Body() data: SendConfirmationDto) {
    return await this.marketingNotificationsService.sendConfirmConsentEmail(data)
  }

  //   Subscribe to receive marketing notifications
  @Post('/public/subscribe')
  @Public()
  async subscribePublic(@Body() data: SubscribePublicDto) {
    if (data.consent === false)
      throw new BadRequestException('Notification consent should be provided')

    return await this.marketingNotificationsService.subscribePublic(data)
  }

  // Unsubscribe to receive marketing notifications
  @Post('/public/unsubscribe')
  @Public()
  async unsubscribePublic(@Body() data: UnsubscribePublicDto) {
    return await this.marketingNotificationsService.unsubscribePublic(data)
  }

  //   Subscribe for logged-in users
  @Post('/subscribe')
  async subscribe(@AuthenticatedUser() user: KeycloakTokenParsed, @Body() data: SubscribeDto) {
    if (data.consent === false)
      throw new BadRequestException('Notification consent should be provided')

    return await this.marketingNotificationsService.subscribe(user)
  }

  //   Unsubscribe for logged-in users
  @Post('/unsubscribe')
  async unsubscribe(@AuthenticatedUser() user: KeycloakTokenParsed, @Body() data: UnsubscribeDto) {
    return await this.marketingNotificationsService.unsubscribe(data, user)
  }

  //   Get campaign notifications for logged-in users
  @Get('/campaign-notifications')
  async campaignNotifications(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.marketingNotificationsService.getCampaignNotificationSubscriptions(
      user.email || '',
    )
  }
}
