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
  GetContactsFromListParam: ContactsFromListParams

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
  GetContactsFromListRes: ContactsResponse[]

  // Implementation specific
  ContactData: ContactData
}

export type ContactsFromListParams = {
  listId: string
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

export interface SendGridExportMetadata {
  prev: string
  self: string
  next: string
  count: number
}

export type SendGridExportResponse = {
  id: string
  _metadata: SendGridExportMetadata
}

export type SendGridExportStatusResponse = {
  id: string
  status: 'pending' | 'failure' | 'ready'
  created_at: string
  updated_at: string
  completed_at: string
  expires_at: string
  urls: string[]
  message?: string
  _metadata: SendGridExportMetadata
  contact_count: number
}

export interface SendgridExportParams {
  list_ids: string[]
  file_type: 'json' | 'csv'
  segments?: string[]
  max_file_size?: number
}

export interface ContactsResponse {
  contact_id: string
  created_at: string
  custom_fields: object
  email: string
  updated_at: string
}
