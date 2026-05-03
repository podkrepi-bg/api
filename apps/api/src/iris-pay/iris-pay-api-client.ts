import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { AxiosRequestConfig } from 'axios'
import {
  CreateCustomerReq,
  CreateIrisCustomerResponse,
  FindCustomerResponse,
  IrisHookHash,
  RegisterWebhookReq,
} from './entities/iris-pay.types'

/**
 * Gateway for the IRIS Pay HTTP API. Every IRIS API call in this codebase
 * should go through this class — no other file should call
 * `httpService.axiosRef.X(this.irisEndpoint + ...)` directly.
 *
 * Why this exists:
 * 1. Single grep target for "what does this app do with IRIS Pay."
 * 2. Single place to add cross-cutting concerns (logging, error mapping,
 *    retries) when we need them.
 * 3. Owns IRIS auth conventions (`agentHash` body field / `x-agent-hash`
 *    header) so callers never assemble headers or auth-bearing payloads
 *    themselves — same role the Stripe SDK plays for `StripeApiClient`.
 *
 * Methods are intentionally thin — orchestration, signing, DB lookups, and
 * error semantics ("not-found vs. hard fail") belong in `IrisPayService`.
 * Each method = exactly one IRIS endpoint. Errors propagate as raw
 * `AxiosError`; the service decides how to interpret them.
 *
 * Signature rule: every method takes `(...inputs, options?: AxiosRequestConfig)`
 * so callers can pass per-call concerns (timeout, signal, extra headers)
 * without having to edit the gateway first.
 */
@Injectable()
export class IrisPayApiClient {
  private readonly agentHash: string
  private readonly endpoint: string

  constructor(private readonly httpService: HttpService, private readonly config: ConfigService) {
    this.agentHash = this.config.get<string>('IRIS_AGENT_HASH', '')
    this.endpoint = this.config.get<string>('IRIS_API_URL', '')
  }

  // Hooks
  async createHook(
    req: Omit<RegisterWebhookReq, 'agentHash'>,
    options?: AxiosRequestConfig,
  ): Promise<string> {
    const body: RegisterWebhookReq = { ...req, agentHash: this.agentHash }
    const res = await this.httpService.axiosRef.post<string>(
      `${this.endpoint}/createhook`,
      body,
      options,
    )
    return res.data
  }

  // Customers
  async findCustomer(email: string, options?: AxiosRequestConfig): Promise<FindCustomerResponse> {
    const res = await this.httpService.axiosRef.post<FindCustomerResponse>(
      `${this.endpoint}/agent/user/check`,
      { email },
      this.withAgentHashHeader(options),
    )
    return res.data
  }

  async signupCustomer(
    req: Omit<CreateCustomerReq, 'agentHash'>,
    options?: AxiosRequestConfig,
  ): Promise<CreateIrisCustomerResponse> {
    const body: CreateCustomerReq = { ...req, agentHash: this.agentHash }
    const res = await this.httpService.axiosRef.post<CreateIrisCustomerResponse>(
      `${this.endpoint}/signup`,
      body,
      options,
    )
    return res.data
  }

  // Payment status
  async getPaymentStatus(hookHash: string, options?: AxiosRequestConfig): Promise<IrisHookHash> {
    const res = await this.httpService.axiosRef.get<IrisHookHash>(
      `${this.endpoint}/status/${hookHash}`,
      this.withAgentHashHeader(options),
    )
    return res.data
  }

  private withAgentHashHeader(options?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...(options ?? {}),
      headers: { ...(options?.headers ?? {}), 'x-agent-hash': this.agentHash },
    }
  }
}
