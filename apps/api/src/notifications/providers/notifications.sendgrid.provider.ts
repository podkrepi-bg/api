import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgClient from '@sendgrid/client'
import { NotificationsProviderInterface } from './notifications.interface.providers'
import { ContactListRes, SGClientResponse, SendGridParams } from './notifications.sendgrid.types'
import { ClientRequest } from '@sendgrid/client/src/request'
import { DateTime } from 'luxon'

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
    const request = {
      url: `/v3/marketing/lists`,
      method: 'POST',
      body: data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    const listId = response?.body['id'] as string

    return listId
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
}
