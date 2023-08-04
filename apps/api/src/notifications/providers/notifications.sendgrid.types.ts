export type SendGridParams = {
  // Parameters
  CreateListParams: CreateListParams
  UpdateListParams: UpdateListParams
  DeleteListParams: DeleteListParams
  AddToListParams: AddToListParams
  RemoveFromListParams: RemoveFromListParams
  GetContactsInfoParams: GetContactsInfoParams
  RemoveFromUnsubscribedParams: RemoveFromUnsubscribedParams
  AddToUnsubscribedParams: AddToUnsubscribedParams

  // Responses
  CreateListRes: string
  UpdateListRes: any
  DeleteListRes: any
  AddToListRes: any
  RemoveFromListRes: any
  GetContactsInfoRes: GetContactsInfoRes
  RemoveFromUnsubscribedRes: any
  AddToUnsubscribedRes: any

  // Implementation specific
  ContactData: ContactData
}

type CreateListParams = {
  name: string
}

type UpdateListParams = {
  id: string
  data: { [key: string]: any }
}

type DeleteListParams = {
  id: string
}

type ContactData = {
  email: string
  first_name?: string
  last_name?: string
  custom_fields?: { [key: string]: string | number }
}

type AddToListParams = {
  contacts: ContactData[]
  list_ids?: string[]
}

type RemoveFromListParams = {
  list_id: string
  contact_ids: string[]
}

type GetContactsInfoParams = {
  emails: string[]
}

type RemoveFromUnsubscribedParams = {
  email: string
}

type AddToUnsubscribedParams = {
  emails: string[]
}

// Reponses
type GetContactsInfoRes = {
  [key: string]: { contact: { id: string; [key: string]: any; list_ids: string[] } }
}
