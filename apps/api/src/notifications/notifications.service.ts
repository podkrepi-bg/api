import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  SendConfirmationDto,
  SendConfirmationResponse,
  SubscribePublicDto,
  SubscribePublicResponse,
  UnsubscribeDto,
  UnsubscribePublicDto,
  UnsubscribePublicResponse,
} from './dto/subscribe.dto'
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
    @Inject(forwardRef(() => CampaignService)) private readonly campaignService: CampaignService,
    private readonly marketingNotificationsProvider: NotificationsProviderInterface<SendGridParams>,
  ) {}

  // Getter for the  marketing provider
  get provider() {
    return this.marketingNotificationsProvider
  }

  async sendConfirmConsentEmail(
    data: SendConfirmationDto,
  ): Promise<SendConfirmationResponse | Error> {
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
    let unregisteredConsent: UnregisteredNotificationConsent | null = null
    if (!registered)
      try {
        unregisteredConsent = await this.prisma.unregisteredNotificationConsent.findUnique({
          where: { email: data.email },
        })
      } catch (e) {
        return new BadRequestException('Failed to get email data')
      }

    // If unregistered consent exists -> user is already subscribed
    if (unregisteredConsent?.consent) return { message: 'Subscribed' }

    // Send confirmation email
    try {
      let record: Person | UnregisteredNotificationConsent

      if (registered) {
        record = registered
      } else {
        unregisteredConsent
          ? (record = unregisteredConsent)
          : // Create
            (record = await this.prisma.unregisteredNotificationConsent.create({
              data: { email: data.email },
            }))
      }

      // Send confirmation link
      await this.sendConfirmEmail({
        record_id: record.id,
        email: data.email,
      })
    } catch (e) {
      return new BadRequestException('Failed to send email ')
    }

    return { message: 'Email Sent' }
  }

  async sendConfirmEmail(data: { record_id: string; email: string; campaignId?: string }) {
    // Send confirmation email
    try {
      const sent = await this.prisma.emailSentRegistry.findFirst({
        where: {
          email: data.email,
          type: data.campaignId ? EmailType.confirmCampaignConsent : EmailType.confirmConsent,
          campaignId: data.campaignId ? data.campaignId : null,
        },
      })

      // Check if email was sent already in the past 10 minutes
      const wasSent = this.emailWasSentRecently(sent, 10)

      if (wasSent) return

      // Secret hash to verify data in the subscribe route
      const secret = this.generateHash(data.record_id)

      await this.sendConfirmationLink({ secret, email: data.email, campaignId: data.campaignId })

      sent
        ? // Update new send date
          await this.prisma.emailSentRegistry.update({
            where: { id: sent.id },
            data: { dateSent: new Date() },
          })
        : // Create new record for the email sent
          await this.prisma.emailSentRegistry.create({
            data: {
              email: data.email,
              type: data.campaignId ? EmailType.confirmCampaignConsent : EmailType.confirmConsent,
              campaignId: data.campaignId ? data.campaignId : null,
              dateSent: new Date(),
            },
          })
    } catch (e) {
      return new BadRequestException('Failed to send email ')
    }
  }

  async subscribePublic(data: SubscribePublicDto): Promise<SubscribePublicResponse | Error> {
    // Check if user is registered
    let registered: Person | null = null
    try {
      const result = await this.prisma.person.findUnique({
        where: { email: data.email },
      })

      // Check hash
      if (this.generateHash(result?.id || '') === data.hash) registered = result
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If registered and has given consent -> user is already subscribed
    if (!data.campaignId && registered?.newsletter) return { message: 'Subscribed' }

    // Check if un-registered consent exists for this email
    let unregisteredConsent: UnregisteredNotificationConsent | null = null
    if (!registered)
      try {
        const result = await this.prisma.unregisteredNotificationConsent.findUnique({
          where: { email: data.email },
        })

        // Check hash
        if (this.generateHash(result?.id || '') === data.hash) unregisteredConsent = result
      } catch (e) {
        return new BadRequestException('Failed to get email data')
      }

    // If unregistered consent exists -> user is already subscribed
    if (!data.campaignId && unregisteredConsent?.consent) return { message: 'Subscribed' }

    if (!registered && !unregisteredConsent) throw new BadRequestException('Invalid hash/email')

    try {
      await this.addContactsToList({
        userInfo: {
          email: data.email,
          firstName: registered?.firstName || '',
          lastName: registered?.lastName || '',
        },
        campaignId: data.campaignId,
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

    return { message: 'Success' }
  }

  async unsubscribePublic(data: UnsubscribePublicDto): Promise<UnsubscribePublicResponse | Error> {
    // Check if user is registered
    let registered: Person | null
    try {
      registered = await this.prisma.person.findUnique({
        where: { email: data.email },
      })
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If registered and no existing consent -> user is already unsubscribed
    if (registered && !registered.newsletter) return { message: 'Unsubscribed' }

    // Check if un-registered consent already exists for this email
    let unregisteredConsent: UnregisteredNotificationConsent | null
    try {
      unregisteredConsent = await this.prisma.unregisteredNotificationConsent.findUnique({
        where: { email: data.email },
      })
    } catch (e) {
      return new BadRequestException('Failed to get email data')
    }
    // If unregistered consent exists -> user is already subscribed
    if (unregisteredConsent && !unregisteredConsent.consent) return { message: 'Unsubscribed' }

    if (!registered && !unregisteredConsent) throw new BadRequestException('Invalid email')

    try {
      await this.unsubscribeEmail({
        userInfo: { email: data.email },
        campaignId: data.campaignId,
      })
    } catch (e) {
      Logger.error('Failed to unsubscribe email', e)
      throw new BadRequestException('Failed to unsubscribe email')
    }

    // update consent status
    try {
      if (!data.campaignId && registered)
        await this.personService.update(registered.id, { newsletter: false })
      if (!data.campaignId && unregisteredConsent)
        await this.personService.updateUnregisteredNotificationConsent(data.email, false)
    } catch (e) {
      Logger.error('Failed to update email consent', e)
      throw new BadRequestException('Failed to update email consent')
    }

    return { message: 'Success' }
  }

  async unsubscribe(data: UnsubscribeDto, user: KeycloakTokenParsed) {
    let userInfo: Person | null
    try {
      userInfo = await this.personService.findOneByKeycloakId(user.sub)
    } catch (e) {
      return new BadRequestException('Failed to get user')
    }

    if (!userInfo || !userInfo.email) return new BadRequestException('User not found')

    // Already unsubscribed
    if (!userInfo.newsletter) return { email: userInfo.email, subscribed: false }

    try {
      await this.unsubscribeEmail({
        userInfo: { email: userInfo.email },
        campaignId: data.campaignId,
      })
    } catch (e) {
      Logger.error('Failed to unsubscribe email', e)
      throw new BadRequestException('Failed to unsubscribe email')
    }

    // update consent status
    try {
      if (!data.campaignId) await this.personService.update(userInfo.id, { newsletter: false })
    } catch (e) {
      Logger.error('Failed to update email consent', e)
      throw new BadRequestException('Failed to update email consent')
    }

    return { message: 'Success' }
  }

  async subscribe(user: KeycloakTokenParsed) {
    let userInfo: Person | null
    try {
      userInfo = await this.personService.findOneByKeycloakId(user.sub)
    } catch (e) {
      return new BadRequestException('Failed to get user')
    }

    if (!userInfo || !userInfo.email) return new BadRequestException('User not found')

    // Already subscribed
    if (userInfo.newsletter) return { email: userInfo.email, subscribed: true }

    try {
      await this.addContactsToList({
        userInfo: {
          email: userInfo.email,
          firstName: userInfo?.firstName || '',
          lastName: userInfo?.lastName || '',
        },
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

    return { message: 'Success' }
  }

  async getCampaignNotificationSubscriptions(email: string) {
    let contactsInfo: SendGridParams['GetContactsInfoRes']
    try {
      // find the contact info in the marketing platform
      contactsInfo = await this.marketingNotificationsProvider.getContactsInfo({
        emails: [email],
      })
    } catch (e) {
      console.log(e)
      if (e.code === 404) return []
      throw new BadRequestException('Failed to get contact data')
    }

    if (!contactsInfo[email]) return []

    const campaignLists = contactsInfo[email].contact?.list_ids

    if (!campaignLists?.length) return []

    try {
      const notificationLists = await this.prisma.notificationList.findMany({
        where: { id: { in: campaignLists } },
        include: { campaign: true },
      })

      return notificationLists
    } catch (e) {
      throw new BadRequestException('Failed to get campaign notification lists data')
    }
  }

  async unsubscribeEmail(data: { userInfo: { email: string }; campaignId?: string }) {
    //If the email wants a general unsubscribe from all notifications
    // Add to unsubscribed list for all notifications
    if (!data.campaignId)
      try {
        await this.marketingNotificationsProvider.addToUnsubscribed({
          emails: [data.userInfo.email],
        })
      } catch (e) {
        Logger.error('Failed to unsubscribe email', e)
        throw new BadRequestException('Failed to unsubscribe email')
      }
    // else remove it only from the particular campaign list
    else if (data.campaignId)
      try {
        //get campaign notification list
        const campaign = await this.prisma.campaign.findUnique({
          where: { id: data.campaignId },
          select: { notificationLists: true },
        })

        if (!campaign) return new NotFoundException('Campaign not found')

        // if such a list exists
        if (campaign?.notificationLists?.length) {
          // find the email id in the marketing platform
          const contactsInfo = await this.marketingNotificationsProvider.getContactsInfo({
            emails: [data.userInfo.email],
          })
          // remove from the campaign notification list
          Object.keys(contactsInfo) &&
            (await this.marketingNotificationsProvider.removeContactsFromList({
              list_id: campaign.notificationLists[0].id,
              contact_ids: [contactsInfo[data.userInfo.email]?.contact.id],
            }))
        }
      } catch (e) {
        Logger.error('Failed to unsubscribe email', e)
        throw new BadRequestException('Failed to unsubscribe email')
      }
  }

  async addContactsToList(data: {
    userInfo: { email: string; firstName: string; lastName: string }
    campaignId?: string
  }) {
    const contact: SendGridParams['ContactData'] = {
      email: data.userInfo.email,
      first_name: data.userInfo?.firstName || '',
      last_name: data.userInfo?.lastName || '',
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
      await this.marketingNotificationsProvider.removeFromUnsubscribed({
        email: data.userInfo.email,
      })
    } catch (e) {
      Logger.error('Failed to subscribe email', e)
      throw new BadRequestException('Failed to subscribe email')
    }
  }

  generateHash(record_id: string): string {
    const hash = crypto.createHash('sha256').update(record_id).digest('hex')

    return hash
  }

  private async sendConfirmationLink(data: { secret: string; email: string; campaignId?: string }) {
    // Public subscribe link
    let link =
      this.config.get<string>('APP_URL', '') +
      `/notifications/subscribe?hash=${data.secret}&email=${data.email}&consent=true`
    if (data.campaignId) link += `&campaign=${data.campaignId}`

    // Prepare Email data
    const recepient = { to: [data.email] }
    const mail = new ConfirmConsentEmailDto({
      subscribeLink: link,
    })

    await this.sendEmail.sendFromTemplate(mail, recepient, {
      //Allow users to receive the mail, regardles of unsubscribes
      bypassUnsubscribeManagement: { enable: true },
    })
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
