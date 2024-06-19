import { MassMailDto } from '../dto/massmail.dto'
import { ContactsMap } from '../notifications.service'
import { PersonalizationData } from '@sendgrid/helpers/classes/personalization'

type NotificationsInterfaceParams = {
  CreateListParams: unknown
  UpdateListParams: unknown
  DeleteListParams: unknown
  AddToListParams: unknown
  RemoveFromListParams: unknown
  GetContactsInfoParams: unknown
  RemoveFromUnsubscribedParams: unknown
  AddToUnsubscribedParams: unknown
  SendNotificationParams: unknown
  GetContactsFromListParam: unknown

  // Responses
  CreateListRes: unknown
  UpdateListRes: unknown
  DeleteListRes: unknown
  AddToListRes: unknown
  RemoveFromListRes: unknown
  GetContactsInfoRes: unknown
  RemoveFromUnsubscribedRes: unknown
  AddToUnsubscribedRes: unknown
  SendNotificationRes: unknown
  GetContactsFromListRes: unknown
}

export abstract class NotificationsProviderInterface<
  T extends NotificationsInterfaceParams = NotificationsInterfaceParams,
> {
  abstract createNewContactList(data: T['CreateListParams']): Promise<T['CreateListRes']>
  abstract updateContactList(data: T['UpdateListParams']): Promise<T['UpdateListRes']>
  abstract deleteContactList(data: T['DeleteListParams']): Promise<T['DeleteListRes']>
  abstract addContactsToList(data: T['AddToListParams']): Promise<T['AddToListRes']>
  abstract getContactsInfo(data: T['GetContactsInfoParams']): Promise<T['GetContactsInfoRes']>
  abstract addToUnsubscribed(data: T['AddToUnsubscribedParams']): Promise<T['AddToUnsubscribedRes']>
  abstract removeContactsFromList(data: T['RemoveFromListParams']): Promise<T['RemoveFromListRes']>
  abstract removeFromUnsubscribed(
    data: T['RemoveFromUnsubscribedParams'],
  ): Promise<T['RemoveFromUnsubscribedRes']>
  abstract sendNotification(data: T['SendNotificationParams']): Promise<T['SendNotificationRes']>
  abstract getContactsFromList(
    data: T['GetContactsFromListParam'],
  ): Promise<T['GetContactsFromListRes']>
  abstract prepareTemplatePersonalizations(
    data: MassMailDto,
    contacts: ContactsMap,
    date?: Date,
  ): PersonalizationData[]

  abstract sendBulkEmail(
    data: MassMailDto,
    contactsMap: ContactsMap[],
    value: string,
    timeout?: number,
  ): Promise<void>
}
