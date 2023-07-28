import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgClient from '@sendgrid/client'
import { NotificationsProviderInterface } from './notifications.interface.providers'
import { SendGridParams } from './notifications.sendgrid.types'
import { ClientRequest } from '@sendgrid/client/src/request'

@Injectable()
export class SendGridNotificationsProvider
  implements NotificationsProviderInterface<SendGridParams>
{
  private emailSender: string

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('sendgrid.apiKey')
    this.emailSender = this.config.get<string>('sendgrid.sender') ?? 'info@podkrepi.bg'
    if (apiKey) {
      sgClient.setApiKey(apiKey)
    } else {
      Logger.warn('no apiKey for sendgrid, will not send notifications')
    }
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
}
