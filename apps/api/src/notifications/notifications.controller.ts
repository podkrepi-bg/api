import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { SendConfirmationDto, SubscribeDto, SubscribePublicDto } from './dto/subscribe.dto'
import { PersonService } from '../person/person.service'
import { ConfigService } from '@nestjs/config'
import { MarketingNotificationsService } from './notifications.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

@ApiTags('notifications')
@Controller('notifications')
export class MarketingNotificationsController {
  constructor(
    private readonly marketingNotificationsService: MarketingNotificationsService,
    private readonly personService: PersonService,
    private readonly config: ConfigService,
  ) {}

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

  //   Subscribe for logged-in users
  @Post('/subscribe')
  async subscribe(@AuthenticatedUser() user: KeycloakTokenParsed, @Body() data: SubscribeDto) {
    if (data.consent === false)
      throw new BadRequestException('Notification consent should be provided')

    return await this.marketingNotificationsService.subscribe(user)
  }
}
