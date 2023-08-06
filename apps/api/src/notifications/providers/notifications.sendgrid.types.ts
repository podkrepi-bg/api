import { MarketingTemplateHTMLFields } from '../marketing_templates/template.type'

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
  UpdateListRes: any
  DeleteListRes: any
  AddToListRes: any
  RemoveFromListRes: any
  GetContactsInfoRes: GetContactsInfoRes
  RemoveFromUnsubscribedRes: any
  AddToUnsubscribedRes: any
  SendNotificationRes: any

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
  data: { [key: string]: any }
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
  [key: string]: { contact: { id: string; [key: string]: any; list_ids: string[] } }
}
