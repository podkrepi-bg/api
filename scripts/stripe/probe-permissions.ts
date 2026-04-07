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
import * as path from 'path'
import * as dotenv from 'dotenv'
import Stripe from 'stripe'
import { StripeApiClient } from '../../apps/api/src/stripe/stripe-api-client'

/**
 * Load .env.local from the repo root as a fallback for STRIPE_SECRET_KEY.
 *
 * Process env always wins — dotenv only fills in keys that aren't already set,
 * so a CI run with `STRIPE_SECRET_KEY` injected from GitHub secrets is never
 * overridden by a stray local file. In dev, this lets `yarn stripe:check-permissions`
 * work with no shell setup as long as the key is in .env.local.
 */
function loadEnvLocalFallback(): void {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
}

const RAK_RE = /Having the '(rak_[a-z_]+)' permission/

/**
 * Map from `rak_*` slug → human-readable dashboard label.
 *
 * Stripe's dashboard groups permissions by resource (a section header) and
 * action (a "Read" or "Write" checkbox), but the API only returns raw slugs.
 * This table translates so the script's output matches what a developer
 * actually sees in https://dashboard.stripe.com/test/apikeys when ticking
 * checkboxes on a restricted key.
 *
 * Notable mismatches between slug and label that you can't derive mechanically:
 *   - rak_plan_*  → "Prices" section (Stripe renamed Plans to Prices but kept
 *                   the legacy slug for backwards compatibility)
 *   - rak_credit_note_*  → may appear under "Invoices" depending on dashboard
 *                          version; verify if you don't see "Credit Notes" as
 *                          its own section.
 *
 * Add new entries here when the probe surfaces a slug not in this table.
 * Unmapped slugs degrade gracefully — the script prints them raw with a note.
 */
const PERMISSION_LABELS: Record<string, { section: string; action: 'Read' | 'Write' }> = {
  // Core resources
  rak_charge_read: { section: 'Charges', action: 'Read' },
  rak_charge_write: { section: 'Charges', action: 'Write' },
  rak_customer_read: { section: 'Customers', action: 'Read' },
  rak_customer_write: { section: 'Customers', action: 'Write' },
  rak_payment_intent_read: { section: 'Payment Intents', action: 'Read' },
  rak_payment_intent_write: { section: 'Payment Intents', action: 'Write' },
  rak_payment_method_read: { section: 'Payment Methods', action: 'Read' },
  rak_payment_method_write: { section: 'Payment Methods', action: 'Write' },
  rak_setup_intent_read: { section: 'Setup Intents', action: 'Read' },
  rak_setup_intent_write: { section: 'Setup Intents', action: 'Write' },
  rak_refund_read: { section: 'Refunds', action: 'Read' },
  rak_refund_write: { section: 'Refunds', action: 'Write' },
  rak_product_read: { section: 'Products', action: 'Read' },
  rak_product_write: { section: 'Products', action: 'Write' },
  rak_invoice_read: { section: 'Invoices', action: 'Read' },
  rak_invoice_write: { section: 'Invoices', action: 'Write' },
  rak_credit_note_read: { section: 'Invoices', action: 'Read' }, // verified in dashboard — credit notes live under Invoices
  rak_credit_note_write: { section: 'Invoices', action: 'Write' },

  // Billing
  rak_subscription_read: { section: 'Subscriptions', action: 'Read' },
  rak_subscription_write: { section: 'Subscriptions', action: 'Write' },
  rak_plan_read: { section: 'Prices', action: 'Read' }, // legacy slug — section is now "Prices"
  rak_plan_write: { section: 'Prices', action: 'Write' },

  // Checkout
  rak_checkout_session_read: { section: 'Checkout Sessions', action: 'Read' },
  rak_checkout_session_write: { section: 'Checkout Sessions', action: 'Write' },
}

type Probe = {
  method: string
  /**
   * The `rak_*` slug this method requires. Used by `--list-all` to print the
   * complete permission inventory without needing a key, and cross-validated
   * against Stripe's actual error message on every probe run — if Stripe says
   * a different slug is missing than what's declared here, the script warns
   * loudly so the declaration can be corrected.
   */
  requiresScope: string
  run: () => Promise<unknown>
}

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
    { method: 'createSetupIntent', requiresScope: 'rak_setup_intent_write', run: () => c.createSetupIntent({}) },
    { method: 'updateSetupIntent', requiresScope: 'rak_setup_intent_write', run: () => c.updateSetupIntent('seti_x', {}) },
    { method: 'cancelSetupIntent', requiresScope: 'rak_setup_intent_write', run: () => c.cancelSetupIntent('seti_x') },
    { method: 'retrieveSetupIntent', requiresScope: 'rak_setup_intent_read', run: () => c.retrieveSetupIntent('seti_x') },

    // PaymentIntents
    {
      method: 'createPaymentIntent',
      requiresScope: 'rak_payment_intent_write',
      // amount must be ≥ 50 cents, otherwise Stripe rejects with an
      // InvalidRequestError BEFORE the permission check, leaving the probe blind.
      run: () => c.createPaymentIntent({ amount: 100, currency: 'usd' }),
    },
    { method: 'updatePaymentIntent', requiresScope: 'rak_payment_intent_write', run: () => c.updatePaymentIntent('pi_x', {}) },
    { method: 'cancelPaymentIntent', requiresScope: 'rak_payment_intent_write', run: () => c.cancelPaymentIntent('pi_x', {}) },
    { method: 'retrievePaymentIntent', requiresScope: 'rak_payment_intent_read', run: () => c.retrievePaymentIntent('pi_x') },

    // PaymentMethods
    { method: 'listPaymentMethods', requiresScope: 'rak_payment_method_read', run: () => c.listPaymentMethods({ customer: 'cus_x' }) },
    {
      method: 'attachPaymentMethod',
      requiresScope: 'rak_payment_method_write',
      run: () => c.attachPaymentMethod('pm_x', { customer: 'cus_x' }),
    },

    // Customers
    { method: 'listCustomers', requiresScope: 'rak_customer_read', run: () => c.listCustomers({}) },
    { method: 'createCustomer', requiresScope: 'rak_customer_write', run: () => c.createCustomer({}) },

    // Products
    { method: 'searchProducts', requiresScope: 'rak_product_read', run: () => c.searchProducts({ query: 'name:"x"' }) },
    { method: 'createProduct', requiresScope: 'rak_product_write', run: () => c.createProduct({ name: 'x' }) },

    // Subscriptions
    { method: 'createSubscription', requiresScope: 'rak_subscription_write', run: () => c.createSubscription({ customer: 'cus_x' }) },
    { method: 'cancelSubscription', requiresScope: 'rak_subscription_write', run: () => c.cancelSubscription('sub_x') },
    { method: 'retrieveSubscription', requiresScope: 'rak_subscription_read', run: () => c.retrieveSubscription('sub_x') },
    { method: 'listSubscriptions', requiresScope: 'rak_subscription_read', run: () => c.listSubscriptions() },

    // Prices
    { method: 'listPrices', requiresScope: 'rak_plan_read', run: () => c.listPrices({}) },

    // Checkout
    {
      method: 'createCheckoutSession',
      requiresScope: 'rak_checkout_session_write',
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
    { method: 'createRefund', requiresScope: 'rak_refund_write', run: () => c.createRefund({ payment_intent: 'pi_x' }) },

    // Charges
    { method: 'retrieveCharge', requiresScope: 'rak_charge_read', run: () => c.retrieveCharge('ch_x') },

    // Invoices
    // Note: declares rak_credit_note_read (not rak_invoice_read) because the
    // expand=['payments.data.payment.payment_intent'] arg used by callers
    // pulls credit-note-related fields, and Stripe enforces that scope on the
    // expanded path. Verified empirically by the cross-validation check.
    { method: 'retrieveInvoice', requiresScope: 'rak_credit_note_read', run: () => c.retrieveInvoice('in_x') },
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

/**
 * Render a sorted, three-column "label | function | slug" table from a set
 * of {slug → callers} entries. Shared between the missing-permissions report
 * and `--list-all`.
 */
function renderRows(scopeToCallers: Map<string, string[]>): void {
  type Row = { label: string; func: string; slug: string }
  const rows: Row[] = []
  for (const [scope, callers] of scopeToCallers.entries()) {
    const mapped = PERMISSION_LABELS[scope]
    const label = mapped ? `${mapped.section} → ${mapped.action}` : '(unmapped — find in dashboard)'
    for (const caller of callers) {
      rows.push({ label, func: `StripeApiClient.${caller}`, slug: scope })
    }
  }
  rows.sort((a, b) => a.label.localeCompare(b.label) || a.func.localeCompare(b.func))
  const labelW = Math.max(...rows.map((r) => r.label.length))
  const funcW = Math.max(...rows.map((r) => r.func.length))
  for (const r of rows) {
    console.error(`  ${r.label.padEnd(labelW)}   ${r.func.padEnd(funcW)}   (${r.slug})`)
  }
}

async function main() {
  loadEnvLocalFallback()
  const args = new Set(process.argv.slice(2))
  const listAll = args.has('--list-all')

  // --list-all is a documentation/onboarding mode: print every permission the
  // codebase needs based on the declared `requiresScope` on each probe, without
  // making any network calls. Used by `yarn stripe:check-permissions --list-all`
  // for first-time setup ("here are the boxes to tick before you run the real
  // check"). Doesn't need a STRIPE_SECRET_KEY.
  if (listAll) {
    // Pass a dummy stripe instance — buildProbes only uses it to construct the
    // run() closures, which never get called in --list-all mode.
    const probes = buildProbes(new StripeApiClient(new Stripe('sk_test_dummy_for_list_all')))
    const scopeToCallers = new Map<string, string[]>()
    for (const p of probes) {
      const callers = scopeToCallers.get(p.requiresScope) ?? []
      callers.push(p.method)
      scopeToCallers.set(p.requiresScope, callers)
    }
    console.error(
      `\nThis app uses ${scopeToCallers.size} unique Stripe permission(s) across ${probes.length} ` +
        `gateway methods. Enable all ${scopeToCallers.size} on your restricted key at:\n`,
    )
    console.error('  https://dashboard.stripe.com/test/apikeys\n')
    renderRows(scopeToCallers)
    console.error(
      '\nThen run `yarn stripe:check-permissions` (no flag) to verify your key has them all.',
    )
    process.exit(0)
  }

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


  // Cross-validation 1 — wrong-slug detection.
  // Every probe declares a `requiresScope`, and Stripe tells us empirically
  // which scope was actually missing. If they disagree, the declaration in
  // buildProbes() is wrong and should be fixed.
  const probeByMethod = new Map(probes.map((p) => [p.method, p]))
  const resultByMethod = new Map(results.map((r) => [r.method, r]))
  const mismatches: { method: string; declared: string; actual: string }[] = []
  for (const r of results) {
    if (!r.missingScope) continue
    const declared = probeByMethod.get(r.method)?.requiresScope
    if (declared && declared !== r.missingScope) {
      mismatches.push({ method: r.method, declared, actual: r.missingScope })
    }
  }
  if (mismatches.length > 0) {
    console.error(
      `\nWARNING: ${mismatches.length} probe(s) have a wrong requiresScope declaration. ` +
        `Update buildProbes() in this file:`,
    )
    for (const m of mismatches) {
      console.error(`  ${m.method}: declared ${m.declared}, actual ${m.actual}`)
    }
    console.error(
      "  (--list-all uses the declared values, so it'll be wrong until these are corrected.)",
    )
  }

  // Cross-validation 2 — blind-probe detection.
  // For each scope confirmed missing by at least one probe, check whether *every*
  // other probe declaring the same scope also surfaced the missing-permission
  // error. If one didn't, its arguments are probably tripping Stripe's input
  // validation BEFORE the permission check — meaning the probe is blind and
  // would silently pass even if the scope were missing in CI.
  const confirmedMissing = new Set(
    results.filter((r) => r.missingScope).map((r) => r.missingScope as string),
  )
  const blindProbes: { method: string; expectedScope: string; actualError: string }[] = []
  for (const p of probes) {
    if (!confirmedMissing.has(p.requiresScope)) continue
    const r = resultByMethod.get(p.method)
    if (r && r.missingScope === null) {
      blindProbes.push({
        method: p.method,
        expectedScope: p.requiresScope,
        actualError: r.rawError ?? '(no error)',
      })
    }
  }
  if (blindProbes.length > 0) {
    console.error(
      `\nWARNING: ${blindProbes.length} probe(s) appear to be BLIND — they declare a scope that ` +
        `is confirmed missing by other probes, but did not surface a permission error themselves.\n` +
        `This usually means the probe args are tripping Stripe's input validation BEFORE the\n` +
        `permission check, so the probe would silently pass even if the scope were missing.\n` +
        `Fix the probe args in buildProbes() so the call reaches the permission check:\n`,
    )
    for (const b of blindProbes) {
      console.error(`  ${b.method} (expected to fail with ${b.expectedScope})`)
      console.error(`    instead got: ${b.actualError.slice(0, 140)}`)
    }
    console.error(
      "\n  (If many scopes are missing at once, Stripe may return a different error format\n" +
        "   instead of naming a single rak_*. Re-enabling some scopes usually clears this.)",
    )
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

  console.error(
    `\nMissing ${missing.size} Stripe permission(s). ` +
      `Enable in https://dashboard.stripe.com/test/apikeys :\n`,
  )
  renderRows(missing)
  console.error('\nClick your restricted key, tick the boxes above, save, and re-run.')
  process.exit(1)
}

main().catch((err) => {
  console.error('Probe crashed unexpectedly:', err)
  process.exit(3)
})
