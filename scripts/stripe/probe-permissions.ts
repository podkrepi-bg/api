/**
 * Probe Stripe permissions on the configured restricted key.
 *
 * For every method on StripeApiClient, fires one HTTP request to Stripe with
 * minimal arguments shaped to satisfy the SDK's client-side validation, then
 * inspects the error (if any) for a `Having the 'rak_*' permission` message.
 *
 * Stripe checks key permissions BEFORE validating the resource exists, so
 * `cancelSetupIntent('seti_x')` returns:
 *   - 401 with `Having the 'rak_setup_intent_write'` if the key lacks the scope
 *   - "No such setup_intent: 'seti_x'" if the key has the scope
 * Either way, the call has the answer we need without creating real objects
 * (for the read/lookup probes) or with only empty objects (for the create probes).
 *
 * Why an explicit list instead of reflecting over StripeApiClient.prototype:
 * tried that first. The Node SDK has per-method type validation that rejects
 * generic garbage args before sending, AND a legacy positional-string overload
 * that interprets a stray string as a per-call API key. Both produce false
 * negatives. The only reliable approach is one minimal-but-shaped call per
 * method, written by hand.
 *
 * Maintenance rule: when you add a method to StripeApiClient, add a probe
 * here in the SAME PR. The check below enforces the count match.
 *
 * Usage:
 *   yarn stripe:check-permissions
 *
 * STRIPE_SECRET_KEY is read from .env.local automatically (or from process.env
 * in CI). No shell preamble required.
 */
import * as fs from 'fs'
import * as path from 'path'
import Stripe from 'stripe'
import { StripeApiClient } from '../../apps/api/src/stripe/stripe-api-client'

/**
 * Load .env.local from the repo root as a fallback for STRIPE_SECRET_KEY.
 *
 * Process env always wins — this only fills in keys that aren't already set,
 * so a CI run with `STRIPE_SECRET_KEY` injected from GitHub secrets is never
 * overridden by a stray local file. In dev, this lets `yarn stripe:probe`
 * work with no shell setup as long as the key is in .env.local.
 *
 * Intentionally minimal: handles `KEY=VALUE` lines, ignores blanks and `#`
 * comments, strips wrapping single/double quotes, does not handle multi-line
 * values or escaped characters. If you need more, install dotenv.
 */
function loadEnvLocalFallback(): void {
  const envPath = path.resolve(__dirname, '../../.env.local')
  if (!fs.existsSync(envPath)) return
  const contents = fs.readFileSync(envPath, 'utf8')
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const RAK_RE = /Having the '(rak_[a-z_]+)' permission/

type Probe = { method: string; run: () => Promise<unknown> }

/**
 * One probe per StripeApiClient method. Each call is shaped to pass the SDK's
 * client-side validation and reach Stripe. The expected outcome for a correctly
 * scoped key is either:
 *   - a "no such resource" error (for ID-based methods), or
 *   - a successful response / validation error (for params-based methods).
 * The expected outcome for an under-scoped key is a `rak_*` permission error,
 * which the regex above extracts.
 */
function buildProbes(c: StripeApiClient): Probe[] {
  return [
    // SetupIntents
    { method: 'createSetupIntent', run: () => c.createSetupIntent({}) },
    { method: 'updateSetupIntent', run: () => c.updateSetupIntent('seti_x', {}) },
    { method: 'cancelSetupIntent', run: () => c.cancelSetupIntent('seti_x') },
    { method: 'retrieveSetupIntent', run: () => c.retrieveSetupIntent('seti_x') },

    // PaymentIntents
    {
      method: 'createPaymentIntent',
      run: () => c.createPaymentIntent({ amount: 1, currency: 'usd' }),
    },
    { method: 'updatePaymentIntent', run: () => c.updatePaymentIntent('pi_x', {}) },
    { method: 'cancelPaymentIntent', run: () => c.cancelPaymentIntent('pi_x', {}) },
    { method: 'retrievePaymentIntent', run: () => c.retrievePaymentIntent('pi_x') },

    // PaymentMethods
    { method: 'listPaymentMethods', run: () => c.listPaymentMethods({ customer: 'cus_x' }) },
    {
      method: 'attachPaymentMethod',
      run: () => c.attachPaymentMethod('pm_x', { customer: 'cus_x' }),
    },

    // Customers
    { method: 'listCustomers', run: () => c.listCustomers({}) },
    { method: 'createCustomer', run: () => c.createCustomer({}) },

    // Products
    { method: 'searchProducts', run: () => c.searchProducts({ query: 'name:"x"' }) },
    { method: 'createProduct', run: () => c.createProduct({ name: 'x' }) },

    // Subscriptions
    { method: 'createSubscription', run: () => c.createSubscription({ customer: 'cus_x' }) },
    { method: 'cancelSubscription', run: () => c.cancelSubscription('sub_x') },
    { method: 'retrieveSubscription', run: () => c.retrieveSubscription('sub_x') },
    { method: 'listSubscriptions', run: () => c.listSubscriptions() },

    // Prices
    { method: 'listPrices', run: () => c.listPrices({}) },

    // Checkout
    {
      method: 'createCheckoutSession',
      run: () =>
        c.createCheckoutSession({
          mode: 'payment',
          success_url: 'https://example.com/s',
          cancel_url: 'https://example.com/c',
          line_items: [
            {
              price_data: { currency: 'usd', unit_amount: 1, product_data: { name: 'x' } },
              quantity: 1,
            },
          ],
        }),
    },

    // Refunds
    { method: 'createRefund', run: () => c.createRefund({ payment_intent: 'pi_x' }) },

    // Charges
    { method: 'retrieveCharge', run: () => c.retrieveCharge('ch_x') },

    // Invoices
    { method: 'retrieveInvoice', run: () => c.retrieveInvoice('in_x') },
  ]
}

type ProbeOutcome = {
  method: string
  missingScope: string | null
  rawError: string | null
}

async function runProbe(p: Probe): Promise<ProbeOutcome> {
  try {
    await p.run()
    return { method: p.method, missingScope: null, rawError: null }
  } catch (err) {
    const message =
      (err as { raw?: { message?: string }; message?: string })?.raw?.message ??
      (err as { message?: string })?.message ??
      String(err)
    const match = message.match(RAK_RE)
    return {
      method: p.method,
      missingScope: match ? match[1] : null,
      rawError: message,
    }
  }
}

async function main() {
  loadEnvLocalFallback()
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error('STRIPE_SECRET_KEY is required')
    process.exit(2)
  }

  const stripe = new Stripe(key)
  const client = new StripeApiClient(stripe)
  const probes = buildProbes(client)

  // Drift guard: if you add a method to StripeApiClient, you must also add a probe.
  const gatewayMethods = Object.getOwnPropertyNames(StripeApiClient.prototype).filter(
    (m) => m !== 'constructor',
  )
  const probeMethodNames = new Set(probes.map((p) => p.method))
  const unprobed = gatewayMethods.filter((m) => !probeMethodNames.has(m))
  if (unprobed.length > 0) {
    console.error(`\nERROR: ${unprobed.length} StripeApiClient method(s) have no probe defined:`)
    for (const m of unprobed) console.error(`  - ${m}`)
    console.error('\nAdd a probe for each in buildProbes() above. Every wrapper must have a probe')
    console.error('so the permission check stays comprehensive as the gateway grows.')
    process.exit(4)
  }

  // Chunked execution to stay safely under Stripe's account-wide test-mode rate
  // limit (25 req/sec for reads + 25 for writes, shared across all resources).
  // 5 concurrent at a time with a 100ms gap = max ~50 req/sec peak burst across
  // both pools combined, comfortably below the limit even if a sibling CI run
  // is firing at the same time. Without this, a 429 would look like a benign
  // "non-permission error" and silently pass — a false negative.
  const CONCURRENCY = 5
  const DELAY_MS = 100
  console.log(
    `Probing ${probes.length} StripeApiClient methods (${CONCURRENCY} at a time)...\n`,
  )
  const results: ProbeOutcome[] = []
  for (let i = 0; i < probes.length; i += CONCURRENCY) {
    const chunk = probes.slice(i, i + CONCURRENCY)
    const chunkResults = await Promise.all(chunk.map(runProbe))
    results.push(...chunkResults)
    if (i + CONCURRENCY < probes.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    }
  }


  const missing = new Map<string, string[]>()
  for (const r of results) {
    if (r.missingScope) {
      const callers = missing.get(r.missingScope) ?? []
      callers.push(r.method)
      missing.set(r.missingScope, callers)
    }
  }

  if (missing.size === 0) {
    console.log('OK — no missing Stripe permissions detected on this key.')
    process.exit(0)
  }

  console.error(`\nMissing ${missing.size} Stripe permission(s) on the configured key:\n`)
  for (const [scope, callers] of [...missing.entries()].sort()) {
    console.error(`  ${scope}`)
    for (const caller of callers) {
      console.error(`    used by: StripeApiClient.${caller}`)
    }
  }
  console.error('\nFix: open https://dashboard.stripe.com/apikeys, edit the restricted key,')
  console.error('     enable each scope above, save, and re-run this probe.')
  process.exit(1)
}

main().catch((err) => {
  console.error('Probe crashed unexpectedly:', err)
  process.exit(3)
})
