export type SendGridParams = {
  CreateListParams: CreateListParams
  UpdateListParams: UpdateListParams
  DeleteListParams: DeleteListParams
  AddToListParams: AddToListParams
  RemoveFromListParams: RemoveFromListParams
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
