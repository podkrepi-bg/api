type NotificationsInterfaceParams = {
  CreateListParams: any
  UpdateListParams: any
  DeleteListParams: any
  AddToListParams: any
  RemoveFromListParams: any
  GetContactsInfoParams: any
  RemoveFromUnsubscribedParams: any
  AddToUnsubscribedParams: any

  // Responses
  CreateListRes: any
  UpdateListRes: any
  DeleteListRes: any
  AddToListRes: any
  RemoveFromListRes: any
  GetContactsInfoRes: any
  RemoveFromUnsubscribedRes: any
  AddToUnsubscribedRes: any
}

export abstract class NotificationsProviderInterface<T extends NotificationsInterfaceParams> {
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
}
