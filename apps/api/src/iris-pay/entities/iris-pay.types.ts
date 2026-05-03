export type RegisterWebhookReq = {
  url: string
  state?: string
  agentHash: string
  successUrl?: string
  errorUrl?: string
}

export type CreateCustomerReq = {
  agentHash: string
  companyName?: string
  uic?: string
  name?: string
  middleName?: string
  family?: string
  identityHash?: string
  email?: string
  webhookUrl?: string
}

export type CreateIrisCustomerResponse = {
  userHash: string
  idUrl: string | null
  identifyStatusUrl: string | null
  identifyToken: string | null
  identified: boolean
}

export type FindCustomerResponse = {
  userHash: string
  name: string | null
  lastname: string | null
  surname: string | null
}
