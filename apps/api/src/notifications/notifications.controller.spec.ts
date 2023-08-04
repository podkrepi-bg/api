import { TestingModule, Test } from '@nestjs/testing'
import { MarketingNotificationsController } from './notifications.controller'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationGateway } from '../sockets/notifications/gateway'
import { NotificationService } from '../sockets/notifications/notification.service'
import { VaultService } from '../vault/vault.service'
import { MarketingNotificationsService } from './notifications.service'
import { NotificationsProviderInterface } from './providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from './providers/notifications.sendgrid.provider'
import { ConfigService } from '@nestjs/config'
import {
  Campaign,
  EmailSentRegistry,
  EmailType,
  Person,
  UnregisteredNotificationConsent,
} from '@prisma/client'
import { SendGridParams } from './providers/notifications.sendgrid.types'
import { KeycloakTokenParsed } from '../auth/keycloak'

const RegisteredMock = {
  id: 'some-id',
  newsletter: true,
  email: 'registered@gmail.com',
  firstName: 'Test',
  lastName: 'One',
} as Person

const UnRegisteredMock = {
  id: 'some-id',
  consent: true,
  email: 'unregistered@gmail.com',
} as UnregisteredNotificationConsent

const EmailRecordMock = {
  id: 'some-id',
  //   Now minus 3 minutes
  dateSent: new Date(Date.now() - 1000 * 60 * 3),
  email: 'unregistered@gmail.com',
} as EmailSentRegistry

const CampaignMock = {
  id: 'someCampaignId',
  notificationLists: [{ id: 'campaign-notification-list-id' }],
} as Campaign & { notificationLists: { id: string }[] }

const emailServiceMock = {
  sendFromTemplate: jest.fn(() => {
    return true
  }),
}

describe('MarketingNotificationsController', () => {
  let controller: MarketingNotificationsController
  let marketingProvider: NotificationsProviderInterface<SendGridParams>
  let emailService: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [MarketingNotificationsController],
      providers: [
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        CampaignService,
        MockPrismaService,
        VaultService,
        PersonService,
        NotificationService,
        NotificationGateway,
        EmailService,
        TemplateService,
        MarketingNotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_URL') return 'podkrepi.bg'
              if (key === 'sendgrid.marketingListId') return 'marketing_list_id'
              return null
            }),
          },
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile()

    controller = module.get<MarketingNotificationsController>(MarketingNotificationsController)
    emailService = module.get<EmailService>(EmailService)
    marketingProvider = module.get<NotificationsProviderInterface<SendGridParams>>(
      NotificationsProviderInterface,
    )

    // SpyOns
    jest.spyOn(marketingProvider, 'createNewContactList').mockImplementation(async () => '')
    jest.spyOn(marketingProvider, 'removeFromUnsubscribed').mockImplementation(async () => '')
    jest.spyOn(marketingProvider, 'addToUnsubscribed').mockImplementation(async () => '')
    jest.spyOn(marketingProvider, 'removeContactsFromList').mockImplementation(async () => '')
    jest.spyOn(marketingProvider, 'addContactsToList').mockImplementation(async () => '')
    jest.spyOn(marketingProvider, 'getContactsInfo').mockImplementation(async () => ({}))
    //   Mock hash
    jest
      .spyOn(MarketingNotificationsService.prototype as any, 'generateHash')
      .mockReturnValue('hash-value')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('sendConfirmation', () => {
    it('should skip sending if user is registered + subscribed', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)

      await expect(controller.sendConfirmation({ email: RegisteredMock.email })).resolves.toEqual({
        message: 'Subscribed',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      // All other functions should nat have been called
      expect(prismaMock.unregisteredNotificationConsent.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.upsert).not.toHaveBeenCalled()
      expect(emailService.sendFromTemplate).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.update).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.create).not.toHaveBeenCalled()
    })

    it('should skip sending if user is non-registered + subscribed', async () => {
      // Not registered
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(UnRegisteredMock)

      await expect(controller.sendConfirmation({ email: UnRegisteredMock.email })).resolves.toEqual(
        {
          message: 'Subscribed',
        },
      )

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })
      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, consent: true },
      })

      // All other functions should nat have been called
      expect(prismaMock.emailSentRegistry.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.upsert).not.toHaveBeenCalled()
      expect(emailService.sendFromTemplate).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.update).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.create).not.toHaveBeenCalled()
    })

    it('should send email to non logged user with no-consent', async () => {
      // Not registered
      prismaMock.person.findFirst.mockResolvedValue(null)
      //   No consent
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue({
        ...UnRegisteredMock,
        consent: false,
      })
      //Mock that email was sent already previously
      prismaMock.emailSentRegistry.findFirst.mockResolvedValue(EmailRecordMock)

      await expect(controller.sendConfirmation({ email: UnRegisteredMock.email })).resolves.toEqual(
        {
          message: 'Email Sent',
        },
      )

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })
      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, consent: true },
      })

      expect(prismaMock.emailSentRegistry.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, type: EmailType.confirmConsent },
      })
      expect(prismaMock.unregisteredNotificationConsent.upsert).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
        create: { mailHash: 'hash-value', email: UnRegisteredMock.email },
        update: { mailHash: 'hash-value' },
      })
      expect(emailService.sendFromTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        {
          to: [UnRegisteredMock.email],
        },
        { bypassUnsubscribeManagement: { enable: true } },
      )
      expect(prismaMock.emailSentRegistry.update).toHaveBeenCalledWith({
        where: { id: EmailRecordMock.id },
        data: { dateSent: expect.any(Date) },
      })

      // All other functions should nat have been called
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.create).not.toHaveBeenCalled()
    })

    it('should send email to logged user with no-consent', async () => {
      // Registered - no consent
      prismaMock.person.findFirst.mockResolvedValue({ ...RegisteredMock, newsletter: false })
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)
      //Mock that email was sent already previously
      prismaMock.emailSentRegistry.findFirst.mockResolvedValue(EmailRecordMock)

      await expect(controller.sendConfirmation({ email: RegisteredMock.email })).resolves.toEqual({
        message: 'Email Sent',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })
      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, consent: true },
      })

      expect(prismaMock.emailSentRegistry.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, type: EmailType.confirmConsent },
      })
      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { mailHash: 'hash-value' },
      })
      expect(emailService.sendFromTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        {
          to: [RegisteredMock.email],
        },
        { bypassUnsubscribeManagement: { enable: true } },
      )
      expect(prismaMock.emailSentRegistry.update).toHaveBeenCalledWith({
        where: { id: EmailRecordMock.id },
        data: { dateSent: expect.any(Date) },
      })

      // All other functions should nat have been called
      expect(prismaMock.unregisteredNotificationConsent.upsert).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.create).not.toHaveBeenCalled()
    })

    it('should skip sending email if last sent was less than one minute ago', async () => {
      // Registered - no consent
      prismaMock.person.findFirst.mockResolvedValue({ ...RegisteredMock, newsletter: false })
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)
      //Mock that email was sent already previously - 5 sec ago
      prismaMock.emailSentRegistry.findFirst.mockResolvedValue({
        ...EmailRecordMock,
        dateSent: new Date(Date.now() - 1000 * 50 * 1),
      })

      await expect(controller.sendConfirmation({ email: RegisteredMock.email })).resolves.toEqual({
        message: 'Email Sent',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })
      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, consent: true },
      })

      expect(prismaMock.emailSentRegistry.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, type: EmailType.confirmConsent },
      })

      // All other functions should nat have been called
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(emailService.sendFromTemplate).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.upsert).not.toHaveBeenCalled()
      expect(prismaMock.emailSentRegistry.create).not.toHaveBeenCalled()
    })
  })

  describe('subscribePublic', () => {
    it('should throw if email+hash not found', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)

      await expect(
        controller.subscribePublic({
          email: RegisteredMock.email,
          consent: true,
          hash: 'some-hash',
        }),
      ).rejects.toThrow('Invalid hash/email')

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      // All other functions should nat have been called
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()
      expect(marketingProvider.addContactsToList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should skip calling Marketing Platform if user is registered + subscribed', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)

      await expect(
        controller.subscribePublic({
          email: RegisteredMock.email,
          consent: true,
          hash: 'some-hash',
        }),
      ).resolves.toEqual({
        message: 'Subscribed',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      // All other functions should nat have been called
      expect(prismaMock.unregisteredNotificationConsent.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()
      expect(marketingProvider.addContactsToList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should skip calling Marketing Platform if user is non-registered + subscribed', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(UnRegisteredMock)

      await expect(
        controller.subscribePublic({
          email: UnRegisteredMock.email,
          consent: true,
          hash: 'some-hash',
        }),
      ).resolves.toEqual({
        message: 'Subscribed',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, mailHash: 'some-hash' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, mailHash: 'some-hash' },
      })

      // All other functions should nat have been called
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()
      expect(marketingProvider.addContactsToList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should add unsubscribed NOT registered email to Marketing Platform main marketing list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue({
        ...UnRegisteredMock,
        consent: false,
      })

      await expect(
        controller.subscribePublic({
          email: UnRegisteredMock.email,
          consent: true,
          hash: 'some-hash',
        }),
      ).resolves.toEqual({ message: 'Success' })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, mailHash: 'some-hash' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email, mailHash: 'some-hash' },
      })

      // No campaign provided to be subscribed to
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()

      expect(marketingProvider.addContactsToList).toHaveBeenCalledWith({
        contacts: [
          {
            email: UnRegisteredMock.email,
            first_name: '',
            last_name: '',
          },
        ],
        list_ids: ['marketing_list_id'],
      })

      expect(prismaMock.person.update).not.toHaveBeenCalled()

      expect(prismaMock.unregisteredNotificationConsent.update).toHaveBeenCalledWith({
        data: { consent: true },
        where: { email: UnRegisteredMock.email },
      })
    })

    it('should add unsubscribed registered email to Marketing Platform main marketing list', async () => {
      prismaMock.person.findFirst.mockResolvedValue({
        ...RegisteredMock,
        newsletter: false,
      })
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)

      await expect(
        controller.subscribePublic({
          email: RegisteredMock.email,
          consent: true,
          hash: 'some-hash',
        }),
      ).resolves.toEqual({ message: 'Success' })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      // No campaign provided to be subscribed to
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()

      expect(marketingProvider.addContactsToList).toHaveBeenCalledWith({
        contacts: [
          {
            email: RegisteredMock.email,
            first_name: RegisteredMock.firstName,
            last_name: RegisteredMock.lastName,
          },
        ],
        list_ids: ['marketing_list_id'],
      })

      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { newsletter: true },
      })

      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should add email to Marketing Platform marketing list + campaign list if provided campaign id', async () => {
      prismaMock.person.findFirst.mockResolvedValue({
        ...RegisteredMock,
        newsletter: false,
      })
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)
      prismaMock.campaign.findFirst.mockResolvedValue(CampaignMock)

      await expect(
        controller.subscribePublic({
          email: RegisteredMock.email,
          consent: true,
          hash: 'some-hash',
          campaignId: CampaignMock.notificationLists[0].id,
        }),
      ).resolves.toEqual({ message: 'Success' })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email, mailHash: 'some-hash' },
      })

      // No campaign provided to be subscribed to
      expect(prismaMock.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CampaignMock.notificationLists[0].id } }),
      )
      // Alredy exists
      expect(prismaMock.notificationList.create).not.toHaveBeenCalled()
      expect(marketingProvider.createNewContactList).not.toHaveBeenCalled()

      expect(marketingProvider.addContactsToList).toHaveBeenCalledWith({
        contacts: [
          {
            email: RegisteredMock.email,
            first_name: RegisteredMock.firstName,
            last_name: RegisteredMock.lastName,
          },
        ],
        list_ids: [CampaignMock.notificationLists[0].id, 'marketing_list_id'],
      })

      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { newsletter: true },
      })

      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribePublic', () => {
    it('should throw if email not found', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)

      await expect(
        controller.unsubscribePublic({
          email: 'nonexisting@mail.com',
        }),
      ).rejects.toThrow('Invalid email')

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: 'nonexisting@mail.com' },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: 'nonexisting@mail.com' },
      })

      // All other functions should nat have been called
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should skip calling Marketing Platform if user is registered + UNsubscribed already', async () => {
      prismaMock.person.findFirst.mockResolvedValue({ ...RegisteredMock, newsletter: false })

      await expect(
        controller.unsubscribePublic({
          email: RegisteredMock.email,
        }),
      ).resolves.toEqual({
        message: 'Unsubscribed',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      // All other functions should nat have been called
      expect(prismaMock.unregisteredNotificationConsent.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should skip calling Marketing Platform if user is non-registered + UNsubscribed already', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue({
        ...UnRegisteredMock,
        consent: false,
      })

      await expect(
        controller.unsubscribePublic({
          email: UnRegisteredMock.email,
        }),
      ).resolves.toEqual({
        message: 'Unsubscribed',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })

      // All other functions should nat have been called
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })

    it('should add subscribed NOT registered email to Marketing Platform global unsubscribe list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(null)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(UnRegisteredMock)

      await expect(
        controller.unsubscribePublic({
          email: UnRegisteredMock.email,
        }),
      ).resolves.toEqual({
        message: 'Success',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: UnRegisteredMock.email },
      })

      expect(marketingProvider.addToUnsubscribed).toHaveBeenCalledWith({
        emails: [UnRegisteredMock.email],
      })

      // Remove from campaign notification lists should not be called
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()

      // Update consent
      expect(prismaMock.unregisteredNotificationConsent.update).toHaveBeenCalledWith({
        data: { consent: false },
        where: { email: UnRegisteredMock.email },
      })
    })

    it('should add subscribed registered email to Marketing Platform global unsubscribe list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)

      await expect(
        controller.unsubscribePublic({
          email: RegisteredMock.email,
        }),
      ).resolves.toEqual({
        message: 'Success',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      expect(marketingProvider.addToUnsubscribed).toHaveBeenCalledWith({
        emails: [RegisteredMock.email],
      })

      // Remove from campaign notification lists should not be called
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()

      // Update consent
      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { newsletter: false },
      })
    })

    it('should remove email only from Marketing Platform campaign list -  WITHOUT adding it to global unsubscribe list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)
      prismaMock.unregisteredNotificationConsent.findFirst.mockResolvedValue(null)
      prismaMock.campaign.findFirst.mockResolvedValue(CampaignMock)
      jest.spyOn(marketingProvider, 'getContactsInfo').mockImplementation(async () => ({
        [RegisteredMock.email]: { contact: { id: 'marketing-platform-id', list_ids: [''] } },
      }))

      await expect(
        controller.unsubscribePublic({
          email: RegisteredMock.email,
          // remove only from particular campaign notifications list
          campaignId: CampaignMock.id,
        }),
      ).resolves.toEqual({
        message: 'Success',
      })

      expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      expect(prismaMock.unregisteredNotificationConsent.findFirst).toHaveBeenCalledWith({
        where: { email: RegisteredMock.email },
      })

      // Should not be removed globally
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()

      // Remove from campaign notification lists should be called
      expect(prismaMock.campaign.findFirst).toHaveBeenCalledWith({
        where: { id: CampaignMock.id },
        select: { notificationLists: true },
      })
      expect(marketingProvider.getContactsInfo).toHaveBeenCalledWith({
        emails: [RegisteredMock.email],
      })
      expect(marketingProvider.removeContactsFromList).toHaveBeenCalledWith({
        list_id: CampaignMock.notificationLists[0].id,
        contact_ids: ['marketing-platform-id'],
      })

      // consent should not be updated
      expect(prismaMock.person.update).not.toHaveBeenCalled()
      expect(prismaMock.unregisteredNotificationConsent.update).not.toHaveBeenCalled()
    })
  })

  describe('subscribe', () => {
    it('should throw if consent not provided', async () => {
      await expect(
        controller.subscribe(
          {
            sub: 'balbla',
            resource_access: { account: { roles: [] } },
            'allowed-origins': [],
          } as KeycloakTokenParsed,
          {
            consent: false,
          },
        ),
      ).rejects.toThrow('Notification consent should be provided')

      prismaMock.person.findFirst.mockResolvedValue({
        ...RegisteredMock,
        newsletter: false,
      })
    })

    it('should add logged user to main marketing list', async () => {
      prismaMock.person.findFirst.mockResolvedValue({ ...RegisteredMock, newsletter: false })

      await expect(
        controller.subscribe(
          {
            sub: 'balbla',
            resource_access: { account: { roles: [] } },
            'allowed-origins': [],
          } as KeycloakTokenParsed,
          {
            consent: true,
          },
        ),
      ).resolves.toEqual({ message: 'Success' })

      expect(marketingProvider.addContactsToList).toHaveBeenCalledWith({
        contacts: [
          {
            email: RegisteredMock.email,
            first_name: RegisteredMock.firstName,
            last_name: RegisteredMock.lastName,
          },
        ],
        list_ids: ['marketing_list_id'],
      })

      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { newsletter: true },
      })
    })
  })

  describe('unsubscribe', () => {
    it('should skip calling Marketing Platform if already unsubscribed', async () => {
      prismaMock.person.findFirst.mockResolvedValue({ ...RegisteredMock, newsletter: false })

      await expect(
        controller.unsubscribe(
          {
            sub: 'balbla',
            resource_access: { account: { roles: [] } },
            'allowed-origins': [],
          } as KeycloakTokenParsed,
          {},
        ),
      ).resolves.toEqual({ email: RegisteredMock.email, subscribed: false })

      // All others should not be called
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()
      expect(prismaMock.person.update).not.toHaveBeenCalled()
    })

    it('should add logged user to Marketing Platform global unsubscribe list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)

      await expect(
        controller.unsubscribe(
          {
            sub: 'balbla',
            resource_access: { account: { roles: [] } },
            'allowed-origins': [],
          } as KeycloakTokenParsed,
          {},
        ),
      ).resolves.toEqual({ message: 'Success' })

      expect(marketingProvider.addToUnsubscribed).toHaveBeenCalledWith({
        emails: [RegisteredMock.email],
      })

      // Remove from campaign notification lists should not be called
      expect(prismaMock.campaign.findFirst).not.toHaveBeenCalled()
      expect(marketingProvider.getContactsInfo).not.toHaveBeenCalled()
      expect(marketingProvider.removeContactsFromList).not.toHaveBeenCalled()

      expect(prismaMock.person.update).toHaveBeenCalledWith({
        where: { id: RegisteredMock.id },
        data: { newsletter: false },
      })
    })

    it('should remove logged user ONLY from Marketing Platform campaign list - WITHOUT adding to global unsubscribe list', async () => {
      prismaMock.person.findFirst.mockResolvedValue(RegisteredMock)
      prismaMock.campaign.findFirst.mockResolvedValue(CampaignMock)
      jest.spyOn(marketingProvider, 'getContactsInfo').mockImplementation(async () => ({
        [RegisteredMock.email]: { contact: { id: 'marketing-platform-id', list_ids: [''] } },
      }))

      await expect(
        controller.unsubscribe(
          {
            sub: 'balbla',
            resource_access: { account: { roles: [] } },
            'allowed-origins': [],
          } as KeycloakTokenParsed,
          // Remove only from particular campaign notifications list
          { campaignId: CampaignMock.id },
        ),
      ).resolves.toEqual({ message: 'Success' })

      // Should not be removed globally
      expect(marketingProvider.addToUnsubscribed).not.toHaveBeenCalled()

      // Remove from campaign notification lists should be called
      expect(prismaMock.campaign.findFirst).toHaveBeenCalledWith({
        where: { id: CampaignMock.id },
        select: { notificationLists: true },
      })
      expect(marketingProvider.getContactsInfo).toHaveBeenCalledWith({
        emails: [RegisteredMock.email],
      })
      expect(marketingProvider.removeContactsFromList).toHaveBeenCalledWith({
        list_id: CampaignMock.notificationLists[0].id,
        contact_ids: ['marketing-platform-id'],
      })

      // consent should not be updated
      expect(prismaMock.person.update).not.toHaveBeenCalled()
    })
  })
})
