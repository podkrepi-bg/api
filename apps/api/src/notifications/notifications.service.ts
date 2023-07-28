import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SendConfirmationDto, SubscribePublicDto } from './dto/subscribe.dto'
import { PersonService } from '../person/person.service'
import { ConfirmConsentEmailDto } from '../email/template.interface'
import { ConfigService } from '@nestjs/config'
import { EmailService } from '../email/email.service'
import {
  EmailSentRegistry,
  EmailType,
  Person,
  UnregisteredNotificationConsent,
} from '@prisma/client'
import { NotificationsProviderInterface } from './providers/notifications.interface.providers'
import { SendGridParams } from './providers/notifications.sendgrid.types'
import { DateTime } from 'luxon'
import * as crypto from 'crypto'
import { CampaignService } from '../campaign/campaign.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

@Injectable()
export class MarketingNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personService: PersonService,
    private readonly config: ConfigService,
    private readonly sendEmail: EmailService,
    private readonly campaignService: CampaignService,
    private readonly marketingNotificationsProvider: NotificationsProviderInterface<SendGridParams>,
  ) {}

  async sendConfirmConsentEmail(data: SendConfirmationDto) {
    // Check if user is registered
    let registered: Person | null
    try {
      registered = await this.personService.findByEmail(data.email)
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If registered and has given consent -> user is already subscribed
    if (registered?.newsletter) return { message: 'Subscribed' }

    // Check if un-registered consent already exists for this email
    let unregisteredConsent: UnregisteredNotificationConsent | null
    try {
      unregisteredConsent = await this.prisma.unregisteredNotificationConsent.findFirst({
        where: { email: data.email, consent: true },
      })
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }

    // If unregistered consent exists -> user is already subscribed
    if (unregisteredConsent?.consent) return { message: 'Subscribed' }

    // Send confirmation email
    try {
      const sent = await this.prisma.emailSentRegistry.findFirst({
        where: { email: data.email, type: EmailType.confirmConsent },
      })
      // Check if email was sent already in the past 1 minutes
      const wasSent = this.emailWasSentRecently(sent, 1)

      if (wasSent) return { message: 'Email Sent' }

      // Secret hash to verify data in the subscribe route
      const secret = this.generateHash()

      // Save hash to record
      registered
        ? // Update
          await this.prisma.person.update({
            where: { id: registered.id },
            data: { mailHash: secret },
          })
        : // Create/Update
          await this.prisma.unregisteredNotificationConsent.upsert({
            where: { email: data.email },
            create: { mailHash: secret, email: data.email },
            update: { mailHash: secret },
          })

      // Public subscribe link
      const link =
        this.config.get<string>('APP_URL', '') +
        `/notifications/subscribe?hash=${secret}&email=${data.email}&consent=true`

      // Prepare Email data
      const recepient = { to: [data.email] }
      const mail = new ConfirmConsentEmailDto({
        subscribeLink: link,
      })

      await this.sendEmail.sendFromTemplate(mail, recepient)

      sent
        ? // Update new send date
          await this.prisma.emailSentRegistry.update({
            where: { id: sent.id },
            data: { dateSent: new Date() },
          })
        : // Create new record for the email sent
          await this.prisma.emailSentRegistry.create({
            data: { email: data.email, type: EmailType.confirmConsent, dateSent: new Date() },
          })
    } catch (e) {
      return new BadRequestException('Failed to send email ')
    }

    return { message: 'Email Sent' }
  }

  async sendUnregisteredConfirmEmail(data: { email: string; campaignId?: string }) {
    // Send confirmation email
    try {
      const sent = await this.prisma.emailSentRegistry.findFirst({
        where: { email: data.email, type: EmailType.confirmConsent },
      })
      // Check if email was sent already in the past 1 minutes
      const wasSent = this.emailWasSentRecently(sent, 1)

      if (wasSent) return

      // Secret hash to verify data in the subscribe route
      const secret = this.generateHash()

      // Save hash to record
      await this.prisma.unregisteredNotificationConsent.upsert({
        where: { email: data.email },
        create: { mailHash: secret, email: data.email },
        update: { mailHash: secret },
      })

      // Public subscribe link
      let link =
        this.config.get<string>('APP_URL', '') +
        `/notifications/subscribe?hash=${secret}&email=${data.email}&consent=true`
      if (data.campaignId) link += `&campaign=${data.campaignId}`

      // Prepare Email data
      const recepient = { to: [data.email] }
      const mail = new ConfirmConsentEmailDto({
        subscribeLink: link,
      })

      await this.sendEmail.sendFromTemplate(mail, recepient)

      sent
        ? // Update new send date
          await this.prisma.emailSentRegistry.update({
            where: { id: sent.id },
            data: { dateSent: new Date() },
          })
        : // Create new record for the email sent
          await this.prisma.emailSentRegistry.create({
            data: { email: data.email, type: EmailType.confirmConsent, dateSent: new Date() },
          })
    } catch (e) {
      return new BadRequestException('Failed to send email ')
    }
  }

  async subscribePublic(data: SubscribePublicDto) {
    // Check if user is registered
    let registered: Person | null
    try {
      registered = await this.prisma.person.findFirst({
        where: { email: data.email, mailHash: data.hash },
      })
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If registered and has given consent -> user is already subscribed
    if (!data.campaignId && registered?.newsletter) return { message: 'Subscribed' }

    // Check if un-registered consent already exists for this email
    let unregisteredConsent: UnregisteredNotificationConsent | null
    try {
      unregisteredConsent = await this.prisma.unregisteredNotificationConsent.findFirst({
        where: { email: data.email, mailHash: data.hash },
      })
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If unregistered consent exists -> user is already subscribed
    if (!data.campaignId && unregisteredConsent?.consent) return { message: 'Subscribed' }

    if (!registered && !unregisteredConsent) throw new BadRequestException('Invalid hash/email')

    const contact: SendGridParams['ContactData'] = {
      email: data.email,
      first_name: registered?.firstName || '',
      last_name: registered?.lastName || '',
    }

    const listIds: string[] = []

    // Find campaign lists if provided
    if (data.campaignId)
      try {
        const campaign = await this.campaignService.getCampaignByIdWithPersonIds(data.campaignId)
        if (campaign)
          if (!campaign?.notificationLists?.length) {
            // Check if the campaign has a notification list
            const campaignList = await this.campaignService.createCampaignNotificationList(campaign)
            // Add email to this campaign's notification list
            listIds.push(campaignList)
          } else {
            listIds.push(campaign.notificationLists[0].id)
          }
      } catch (e) {
        Logger.error(e)
        throw new BadRequestException('Failed to get campaign info')
      }

    // Add email to general marketing notifications list
    const mainList = this.config.get('sendgrid.marketingListId')
    mainList && listIds.push(mainList)

    // Add to marketing platform
    try {
      await this.marketingNotificationsProvider.addContactsToList({
        contacts: [contact],
        list_ids: listIds,
      })
    } catch (e) {
      Logger.error('Failed to subscribe email', e)
      throw new BadRequestException('Failed to subscribe email')
    }

    // If no prior consent has been given by a registered user
    if (registered && !registered.newsletter)
      try {
        await this.personService.update(registered.id, { newsletter: true })
      } catch (e) {
        Logger.error('Failed to update user consent', e)
        throw new BadRequestException('Failed to update user consent')
      }
    // If the email is not registered - create/update a saparate notification consent record
    else if (!registered)
      try {
        await this.personService.updateUnregisteredNotificationConsent(data.email, data.consent)
      } catch (e) {
        Logger.error('Failed to save unregistered consent', e)
        throw new BadRequestException('Failed to save consent')
      }

    return { email: data.email, subscribed: true }
  }

  async subscribe(user: KeycloakTokenParsed) {
    let userInfo: Person | null
    try {
      userInfo = await this.personService.findOneByKeycloakId(user.sub)
    } catch (e) {
      return new BadRequestException('Failed to get user')
    }

    if (!userInfo) return new BadRequestException('User not found')

    const contact: SendGridParams['ContactData'] = {
      email: userInfo.email,
      first_name: userInfo?.firstName || '',
      last_name: userInfo?.lastName || '',
    }

    const listIds: string[] = []

    // Add email to general marketing notifications list
    const mainList = this.config.get('sendgrid.marketingListId')
    mainList && listIds.push(mainList)

    // Add to marketing platform
    try {
      await this.marketingNotificationsProvider.addContactsToList({
        contacts: [contact],
        list_ids: listIds,
      })
    } catch (e) {
      Logger.error('Failed to subscribe email', e)
      throw new BadRequestException('Failed to subscribe email')
    }

    if (!userInfo.newsletter)
      try {
        await this.personService.update(userInfo.id, { newsletter: true })
      } catch (e) {
        Logger.error('Failed to update user consent', e)
        throw new BadRequestException('Failed to update user consent')
      }

    return { email: userInfo.email, subscribed: true }
  }

  generateHash(): string {
    const hash = crypto
      .randomBytes(Math.ceil(32 / 2))
      .toString('hex')
      .slice(0, 32)

    return hash
  }

  private emailWasSentRecently(record: EmailSentRegistry | null, period: number) {
    if (!record) return false

    // Check if email was sent in the provided period
    const now = DateTime.now()
    const dateSent = DateTime.fromJSDate(record.dateSent)
    const minutesPassed = now.diff(dateSent, 'minutes').minutes

    return minutesPassed <= period
  }
}
