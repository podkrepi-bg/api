type NotificationsInterfaceParams = {
  CreateListParams: any
  UpdateListParams: any
  DeleteListParams: any
  AddToListParams: any
  RemoveFromListParams: any
}

export abstract class NotificationsProviderInterface<T extends NotificationsInterfaceParams> {
  abstract createNewContactList(data: T['CreateListParams']): Promise<string>
  abstract updateContactList(data: T['UpdateListParams']): Promise<any>
  abstract deleteContactList(data: T['DeleteListParams']): Promise<any>
  abstract addContactsToList(data: T['AddToListParams']): Promise<any>
  abstract removeContactsFromList(data: T['RemoveFromListParams']): Promise<any>
}
