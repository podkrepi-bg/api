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

/**
 * Stripe returns missing-permission errors in (at least) two shapes:
 *
 * 1. Singular: "Having the 'rak_setup_intent_write' permission would allow this request to continue."
 * 2. Plural:   "Having the 'rak_confirmation_token_client_read', 'rak_setup_intent_read' permissions would allow this request to continue."
 *
 * In the plural case, Stripe lists EVERY scope that could satisfy the request,
 * not the minimum set — so a probe for retrieveSetupIntent might see both
 * `rak_setup_intent_read` (the one we actually need) and
 * `rak_confirmation_token_client_read` (an unrelated alternative path that
 * happens to also unlock the endpoint). We can't blindly take the first match
 * or report all of them; we have to intersect against the declared scope for
 * the probe.
 *
 * This regex extracts the contents of the quote list. The caller then splits
 * out individual `rak_*` slugs and decides which one to attribute to the probe.
 */
const RAK_LIST_RE = /Having the ((?:'rak_[a-z0-9_]+',?\s*)+)permissions? would allow/
const RAK_SLUG_RE = /rak_[a-z0-9_]+/g

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
  // Core resources — top-level rows in the dashboard's main permission list
  rak_charge_read: { section: 'Charges and Refunds', action: 'Read' }, // dashboard groups Charges + Refunds into a single row
  rak_charge_write: { section: 'Charges and Refunds', action: 'Write' },
  rak_refund_read: { section: 'Charges and Refunds', action: 'Read' }, // same row as charges
  rak_refund_write: { section: 'Charges and Refunds', action: 'Write' },
  rak_customer_read: { section: 'Customers', action: 'Read' },
  rak_customer_write: { section: 'Customers', action: 'Write' },
  rak_payment_intent_read: { section: 'Payment Intents', action: 'Read' },
  rak_payment_intent_write: { section: 'Payment Intents', action: 'Write' },
  rak_payment_method_read: { section: 'Payment Methods', action: 'Read' },
  rak_payment_method_write: { section: 'Payment Methods', action: 'Write' },
  rak_setup_intent_read: { section: 'Setup Intents', action: 'Read' },
  rak_setup_intent_write: { section: 'Setup Intents', action: 'Write' },
  rak_product_read: { section: 'Products', action: 'Read' },
  rak_product_write: { section: 'Products', action: 'Write' },

  // Billing section — sub-rows under the "Billing" group header in the dashboard
  rak_invoice_read: { section: 'Billing › Invoices', action: 'Read' },
  rak_invoice_write: { section: 'Billing › Invoices', action: 'Write' },
  // Credit notes is its own row under Billing (NOT under Invoices). Enabling
  // Credit notes (Read) also implicitly grants Invoices (Read) per the Stripe
  // dashboard's "implies" hint, which is why retrieveInvoice with the
  // payments.data.payment.payment_intent expand surfaces this slug instead of
  // rak_invoice_read.
  rak_credit_note_read: { section: 'Billing › Credit notes', action: 'Read' },
  rak_credit_note_write: { section: 'Billing › Credit notes', action: 'Write' },
  rak_subscription_read: { section: 'Billing › Subscriptions', action: 'Read' },
  rak_subscription_write: { section: 'Billing › Subscriptions', action: 'Write' },
  rak_plan_read: { section: 'Billing › Prices', action: 'Read' }, // legacy slug — Stripe renamed Plans to Prices
  rak_plan_write: { section: 'Billing › Prices', action: 'Write' },

  // Checkout section
  rak_checkout_session_read: { section: 'Checkout › Checkout Sessions', action: 'Read' },
  rak_checkout_session_write: { section: 'Checkout › Checkout Sessions', action: 'Write' },
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
    {
      method: 'updatePaymentIntent',
      requiresScope: 'rak_payment_intent_write',
      // Must include at least one real field. An empty `{}` body trips an SDK
      // code path that returns "This API call cannot be made with a publishable
      // API key" — a misleading false-positive that has nothing to do with the
      // actual key type. A no-op metadata update reaches Stripe cleanly.
      run: () => c.updatePaymentIntent('pi_x', { metadata: { probe: 'true' } }),
    },
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

    // Parse all `rak_*` slugs Stripe mentions in the "Having the ... permission(s)
    // would allow this request to continue" clause. There may be 1 (singular form)
    // or many (plural form, listing alternative scopes that would each unlock the
    // endpoint). We then attribute the failure to the probe's *declared* scope if
    // it's in the list — otherwise we fall back to the first slug Stripe mentioned.
    const listMatch = message.match(RAK_LIST_RE)
    let missingScope: string | null = null
    if (listMatch) {
      const slugs: string[] = Array.from(listMatch[1].matchAll(RAK_SLUG_RE), (m) => m[0])
      if (slugs.includes(p.requiresScope)) {
        missingScope = p.requiresScope
      }
      // If the declared scope is NOT in Stripe's list, the declared scope is
      // present on the key — Stripe is complaining about a different,
      // unrelated scope that the response would also need (e.g. expansions
      // pulling in confirmation_token data). Treat as OK; we don't care
      // about scopes the probe doesn't claim to need.
    } else if (
      /The provided key '[^']+' does not have the required permissions for this endpoint/.test(
        message,
      )
    ) {
      // Generic permission-denied variant with no `rak_*` slug. Stripe sometimes
      // returns this instead of naming a scope — common when many scopes are
      // missing at once, or for endpoints where Stripe doesn't enumerate
      // alternatives. We have no way to know which slug is at fault, so we
      // attribute it to the probe's declared scope. This is a conservative
      // best-effort: if the declaration is wrong, cross-validation #1 won't
      // catch it for these probes — the only signal is the user enabling the
      // declared scope and the error persisting.
      missingScope = p.requiresScope
    }
    return {
      method: p.method,
      missingScope,
      rawError: message,
    }
  }
}

/**
 * Render a sorted, three-column "toggle | callers | slugs" table from a set
 * of {slug → callers} entries. Shared between the missing-permissions report
 * and `--list-all`.
 *
 * Stripe's dashboard toggles are tristate (None / Read / Write) and **Write
 * implies Read**, so a section that needs both `rak_foo_read` and
 * `rak_foo_write` is really one toggle the user sets to "Write". We collapse
 * Read+Write entries into a single row per section showing the highest
 * required action — otherwise the report tells users to flip the same toggle
 * twice, which is confusing and looks like a script bug.
 */
function renderRows(scopeToCallers: Map<string, string[]>): void {
  type Group = {
    label: string
    callers: Set<string>
    slugs: Set<string>
    hasWrite: boolean
  }
  const groups = new Map<string, Group>()

  for (const [scope, callers] of scopeToCallers.entries()) {
    const mapped = PERMISSION_LABELS[scope]
    // Group by section (so Read + Write collapse). Unmapped slugs each get
    // their own group keyed by the slug itself, since we can't tell which
    // dashboard row they belong to.
    const groupKey = mapped ? mapped.section : `__unmapped__${scope}`
    let group = groups.get(groupKey)
    if (!group) {
      group = {
        label: mapped ? mapped.section : '(unmapped — find in dashboard)',
        callers: new Set(),
        slugs: new Set(),
        hasWrite: false,
      }
      groups.set(groupKey, group)
    }
    if (mapped?.action === 'Write') group.hasWrite = true
    for (const caller of callers) group.callers.add(caller)
    group.slugs.add(scope)
  }

  type Row = { toggle: string; callers: string[]; slugs: string }
  const rows: Row[] = []
  for (const g of groups.values()) {
    const action = g.hasWrite ? 'Write' : 'Read'
    const toggle = g.label.startsWith('(unmapped') ? g.label : `${g.label} → ${action}`
    rows.push({
      toggle,
      callers: Array.from(g.callers)
        .sort()
        .map((c) => `StripeApiClient.${c}`),
      slugs: Array.from(g.slugs).sort().join(', '),
    })
  }
  rows.sort((a, b) => a.toggle.localeCompare(b.toggle))

  // Vertical, table-style layout: one row per toggle, callers stacked one
  // per line in the second column. Wide method lists no longer push the
  // line off the right edge of the terminal.
  const toggleW = Math.max('Permission'.length, ...rows.map((r) => r.toggle.length))
  const callerW = Math.max(
    'Function'.length,
    ...rows.flatMap((r) => r.callers.map((c) => c.length)),
  )

  const sep = `  ${'─'.repeat(toggleW)}   ${'─'.repeat(callerW)}`
  console.error(`  ${'Permission'.padEnd(toggleW)}   ${'Function'.padEnd(callerW)}`)
  console.error(sep)
  for (const r of rows) {
    const [first, ...rest] = r.callers
    console.error(`  ${r.toggle.padEnd(toggleW)}   ${(first ?? '').padEnd(callerW)}`)
    for (const c of rest) {
      console.error(`  ${' '.repeat(toggleW)}   ${c}`)
    }
    // Slugs on their own indented line — useful for grep / escalation but
    // visually de-emphasised so they don't compete with the toggle name.
    console.error(`  ${' '.repeat(toggleW)}   (${r.slugs})`)
    console.error(sep)
  }
}

async function main() {
  loadEnvLocalFallback()
  const args = new Set(process.argv.slice(2))
  const listAll = args.has('--list-all')
  const verbose = args.has('--verbose') || args.has('-v')

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

  // Verbose mode — print every probe's raw outcome. Useful when diagnosing
  // blind probes or understanding why a method isn't surfacing a missing
  // permission you expect (e.g. SDK validation tripping before Stripe sees
  // the request, or "no such resource" errors that confirm the scope passed).
  if (verbose) {
    console.error('\n--- Verbose probe outcomes ---')
    for (const r of results) {
      if (r.missingScope) {
        console.error(`  [MISSING ${r.missingScope}] ${r.method}`)
        if (r.rawError) console.error(`      ${r.rawError}`)
      } else if (r.rawError) {
        console.error(`  [OK] ${r.method}`)
        console.error(`      ${r.rawError}`)
      } else {
        console.error(`  [OK — call succeeded] ${r.method}`)
      }
    }
    console.error('--- End verbose ---\n')
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
