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
  contactListsRes: unknown
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
  abstract getContactLists(): Promise<T['contactListsRes']>
}
