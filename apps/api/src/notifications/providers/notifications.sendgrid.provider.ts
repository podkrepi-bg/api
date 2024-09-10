import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import { NotificationsProviderInterface } from './notifications.interface.providers'
import {
  ContactListRes,
  ContactsFromListParams,
  ContactsResponse,
  SendGridExportStatusResponse,
  SendGridParams,
  SGClientResponse,
} from './notifications.sendgrid.types'
import { ClientRequest } from '@sendgrid/client/src/request'
import { DateTime } from 'luxon'

import { truncateNameToBytes } from '../helpers/truncateNameToBytes'

import { MassMailDto } from '../dto/massmail.dto'
import { ContactsMap } from '../notifications.service'
import { MailDataRequired } from '@sendgrid/mail'
import { PersonalizationData } from '@sendgrid/helpers/classes/personalization'


@Injectable()
export class SendGridNotificationsProvider
  implements NotificationsProviderInterface<SendGridParams>
{
  private shouldRun: boolean

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('sendgrid.apiKey')
    // If notification sending should be active
    const shouldRun = config.get<string>('sendgrid.sendNotifications', '')
    this.shouldRun = shouldRun === 'true'

    if (apiKey) {
      sgClient.setApiKey(apiKey)
      sgMail.setApiKey(apiKey)
    } else {
      Logger.warn('no apiKey for sendgrid, will not send notifications')
    }
  }

  async getContactLists() {
    const request = {
      url: '/v3/marketing/lists',
      method: 'GET',
    } as ClientRequest
    const [response] = await sgClient.request(request)
    return response as SGClientResponse<ContactListRes>
  }
  async createNewContactList(data: SendGridParams['CreateListParams']) {
    data.name = truncateNameToBytes(data.name, 99)
    const request = {
      url: `/v3/marketing/lists`,
      method: 'POST',
      body: data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    const listId = response?.body['id'] as string

    return listId
  }

  private async createContactExport(listId: string) {
    const request = {
      url: `/v3/marketing/contacts/exports`,
      method: 'POST',
      body: {
        list_ids: [listId],
        file_type: 'json',
      },
    } as ClientRequest
    const [response] = await sgClient.request(request).catch((err) => {
      throw new BadRequestException(`Couldn't create export. Error is ${err}`)
    })
    return response.body as { id: string }
  }

  private async getContactExportStatus(jobId: string) {
    const request = {
      url: `/v3/marketing/contacts/exports/${jobId}`,
      method: 'GET',
    } as ClientRequest
    const [response] = await sgClient.request(request).catch((err) => {
      throw new BadRequestException(`Couldn't create export. Error is ${err}`)
    })
    return response.body as SendGridExportStatusResponse
  }

  async getContactsFromList({ listId }: ContactsFromListParams) {
    const SENDGRID_EXPORT_TIMEOUT = 10000
    const RETRY_LIMIT = 5
    let numOfRetries = 0
    Logger.debug('Creating contacts exports')
    const createContactExport = await this.createContactExport(listId)
    const jobId = createContactExport.id
    Logger.debug(`Created export with id ${jobId}`)
    let exportStatusResponse = await this.getContactExportStatus(jobId)

    do {
      Logger.debug('Waiting export to be finished')
      await new Promise((r) => setTimeout(r, SENDGRID_EXPORT_TIMEOUT))
      exportStatusResponse = await this.getContactExportStatus(jobId)
      Logger.debug(`Export finished with status ${exportStatusResponse.status}`)
      switch (exportStatusResponse.status) {
        case 'failure':
          return Promise.reject(exportStatusResponse.message)
        case 'ready':
          break
        default:
      }
      numOfRetries++
    } while (exportStatusResponse.status === 'pending' && numOfRetries < RETRY_LIMIT)
    if (numOfRetries >= RETRY_LIMIT) {
      throw new InternalServerErrorException(
        `Couldn't export contacts within the limit. Try again later.`,
      )
    }
    const exportUrl = exportStatusResponse.urls[0]
    const response = await fetch(exportUrl)

    const exportFile = await response.arrayBuffer()
    const buffer = Buffer.from(exportFile)

    const contactsList = buffer
      .toString()
      .trim()
      .split('\n')
      .map<ContactsResponse>((contact: string) => JSON.parse(contact))
    Logger.debug(`Exported contacts: ${contactsList.length}`)
    return contactsList
  }

  async updateContactList(data: SendGridParams['UpdateListParams']) {
    const request = {
      url: `/v3/marketing/lists/${data.id}`,
      method: 'PATCH',
      body: data.data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async deleteContactList(data: SendGridParams['DeleteListParams']) {
    const request = {
      url: `/v3/marketing/lists/${data.id}`,
      method: 'DELETE',
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async addContactsToList(data: SendGridParams['AddToListParams']) {
    const request = {
      url: `/v3/marketing/contacts`,
      method: 'PUT',
      body: data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async removeContactsFromList(data: SendGridParams['RemoveFromListParams']) {
    const contact_ids = data.contact_ids.join(',')

    const request = {
      url: `/v3/marketing/lists/${data.list_id}/contacts`,
      method: 'DELETE',
      qs: { contact_ids },
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async getContactsInfo(data: SendGridParams['GetContactsInfoParams']) {
    const request = {
      url: `/v3/marketing/contacts/search/emails`,
      method: 'POST',
      body: data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response.body['result'] as SendGridParams['GetContactsInfoRes']
  }

  async addToUnsubscribed(data: SendGridParams['AddToUnsubscribedParams']) {
    const payload = {
      recipient_emails: data.emails,
    }

    const request = {
      url: `/v3/asm/suppressions/global`,
      method: 'POST',
      body: payload,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async removeFromUnsubscribed(data: SendGridParams['RemoveFromUnsubscribedParams']) {
    const request = {
      url: `/v3/asm/suppressions/global/${data.email}`,
      method: 'DELETE',
    } as ClientRequest

    const [response] = await sgClient.request(request)

    return response
  }

  async sendNotification(data: SendGridParams['SendNotificationParams']) {
    if (!this.shouldRun) return

    // Get template from sendgrid
    let request = {
      url: `/v3/designs/${data.template_id}`,
      method: 'GET',
    } as ClientRequest
    let [response] = await sgClient.request(request)

    // Populate html variables
    let html = response.body['html_content']

    if (!html) return

    for (const field in data.template_data) {
      html = html.replace(new RegExp(`%{${field}}%`, 'g'), data.template_data[field])
    }

    // Set unsubscribe link
    let unsubscribeUrl =
      this.config.get<string>('APP_URL') + `/notifications/unsubscribe?email={{ insert email }}`
    if (data.campaignid) unsubscribeUrl += `&campaign=${data.campaignid}`

    // Prepare SingleSend Email
    request = {
      url: `/v3/marketing/singlesends`,
      method: 'POST',
      body: {
        name: `${response.body['name']} - ${DateTime.now().toFormat('dd-MM-yyyy HH:mm')}`,
        send_to: { list_ids: data.list_ids },
        email_config: {
          subject: data.subject,
          sender_id: parseInt(this.config.get('SENDGRID_SENDER_ID', '')),
          html_content: html,
          custom_unsubscribe_url: unsubscribeUrl,
        },
      },
    } as ClientRequest
    ;[response] = await sgClient.request(request)

    // Send SingleSend Email
    request = {
      url: `/v3/marketing/singlesends/${response.body['id']}/schedule`,
      method: 'PUT',
      body: {
        send_at: 'now',
      },
    } as ClientRequest
    ;[response] = await sgClient.request(request)

    return response
  }

  async sendBulkEmail(data: MassMailDto, contactsMap: ContactsMap[], value: string): Promise<void> {
    const currentDate = new Date()
    contactsMap.forEach((contacts, index) => {
      //Schedule  batches in a minute difference
      currentDate.setMinutes(currentDate.getMinutes() + index)
      this.sendEmail(data, contacts, currentDate, value)
    })
  }

  async sendEmail(
    data: MassMailDto,
    contacts: ContactsMap,
    date: Date,
    value: string,
  ): Promise<void> {
    const personalizations = this.prepareTemplatePersonalizations(data, contacts, date)
    const message: MailDataRequired = {
      personalizations,
      from: this.config.get('SENDGRID_SENDER_EMAIL', ''),
      content: [{ type: 'text/html', value: value }],
      templateId: data.templateId.trim(),
    }
    sgMail
      .send(message)
      .then(() => Logger.debug(`Email sent`))
      .catch((err) => Logger.error(err))
  }

  prepareTemplatePersonalizations(
    data: MassMailDto,
    contacts: ContactsMap,
    date: Date,
  ): PersonalizationData[] {
    const personalizations: PersonalizationData[] = []
    const scheduleAt = Math.floor(date.getTime() / 1000)
    contacts.forEach((mailList, email) => {
      personalizations.push({
        to: { email, name: '' },
        dynamicTemplateData: {
          subscribe_link: `${process.env.APP_URL}/notifications/subscribe?hash=${mailList.hash}&email=${email}&consent=true`,
          unsubscribe_link: `${process.env.APP_URL}/notifications/unsubscribe?email=${email}`,
          subject: data.subject,
        },
        sendAt: scheduleAt,
      })
    })
    return personalizations
  }
}
