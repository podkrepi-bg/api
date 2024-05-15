import { ClientResponse } from '@sendgrid/mail'
import { MarketingTemplateHTMLFields } from '../marketing_templates/template.type'
import Response from '@sendgrid/helpers/classes/response'

export type SGClientResponse<T = object> = Response<T>

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
  SendNotificationParams: SendNotificationParams

  // Responses
  CreateListRes: string
  UpdateListRes: unknown
  DeleteListRes: unknown
  AddToListRes: unknown
  RemoveFromListRes: unknown
  GetContactsInfoRes: GetContactsInfoRes
  RemoveFromUnsubscribedRes: unknown
  AddToUnsubscribedRes: unknown
  SendNotificationRes: unknown
  contactListsRes: SGClientResponse<ContactListRes>

  // Implementation specific
  ContactData: ContactData
}

type ContactData = {
  email: string
  first_name?: string
  last_name?: string
  custom_fields?: { [key: string]: string | number }
}

type CreateListParams = {
  name: string
}

type UpdateListParams = {
  id: string
  data: { [key: string]: unknown }
}

type DeleteListParams = {
  id: string
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

type SendNotificationParams = {
  template_id: string
  template_data: MarketingTemplateHTMLFields
  list_ids: string[]
  subject: string
  campaignid?: string
}

// Reponses
type GetContactsInfoRes = {
  [key: string]: { contact: { id: string; [key: string]: unknown; list_ids: string[] } }
}

type SendGridContactList = {
  id: string
  name: string
  contact_count: number
  _metadata: object
}

export type ContactListRes = {
  result: SendGridContactList[]
  _metadata: object
}
