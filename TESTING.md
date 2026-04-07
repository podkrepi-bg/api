# Testing

## Stripe — first-time setup

You need two things in `.env.local` before the API can talk to Stripe: a
**secret key** (`STRIPE_SECRET_KEY`) and a **webhook signing secret**
(`STRIPE_WEBHOOK_SECRET`). Both are personal to you and easy to obtain.

### 1. Get a personal Stripe test account

If you don't already have one, sign up at <https://dashboard.stripe.com/register>.
You don't need to activate live mode or submit any business details — test
mode works on a fresh account out of the box.

### 2. Create a restricted key (recommended)

We **strongly recommend using a restricted key** (`rk_test_...`) instead of
the unrestricted secret key (`sk_test_...`) for local development. Production
and staging both run on restricted keys, so using one locally too means a code
path that needs a new permission fails the same way in your laptop as it does
in prod — you catch it before deploy, not after.

1. Open <https://dashboard.stripe.com/test/apikeys>
2. Scroll to **Restricted keys** → **Create restricted key**
3. Give it a name like `local-dev-<your-name>`
4. **Leave every permission unchecked for now** — the next step will tell you
   exactly which ones to enable
5. Click **Create key** and copy the `rk_test_...` value
6. Paste it into `.env.local`:

   ```shell
   STRIPE_SECRET_KEY=rk_test_...
   ```

> **Quick start fallback**: if you're working on something that doesn't touch
> Stripe and you just want the API to boot, you can use the unrestricted
> `sk_test_...` from the same dashboard page (under **Standard keys**) and
> skip step 3 entirely. You will not get permission-drift safety this way.

### 3. Discover which permissions your key needs

You'll do this in two passes — list everything, tick the boxes, then verify.

**3a. List every permission the codebase needs:**

```shell
yarn stripe:check-permissions --list-all
```

This prints the full inventory of Stripe permissions the codebase uses,
derived from the `StripeApiClient` gateway in
[apps/api/src/stripe/stripe-api-client.ts](apps/api/src/stripe/stripe-api-client.ts).
**No API key required for this command** — it's a static list of declarations,
safe to run before you've put anything in `.env.local`. Output looks like:

```
This app uses 17 unique Stripe permission(s) across 23 gateway methods. Enable all 17 on your restricted key at:

  https://dashboard.stripe.com/test/apikeys

  Charges → Read              StripeApiClient.retrieveCharge          (rak_charge_read)
  Checkout Sessions → Write   StripeApiClient.createCheckoutSession   (rak_checkout_session_write)
  Customers → Read            StripeApiClient.listCustomers           (rak_customer_read)
  Customers → Write           StripeApiClient.createCustomer          (rak_customer_write)
  ...
```

Each row tells you three things: the **dashboard label** to look for, the
**gateway function** that needs the scope (use this if the label is wrong —
the function name lets you infer the scope), and the **raw `rak_*` slug**
(useful for grep / escalation).

**3b. Tick the boxes in the dashboard.** Open
<https://dashboard.stripe.com/test/apikeys>, edit your restricted key, and
enable every box from the first column. Save.

**3c. Verify your key:**

```shell
yarn stripe:check-permissions
```

This time the script makes real API calls to confirm the key has each scope.
You should see `OK — no missing Stripe permissions detected on this key.` If
anything is missing, the output is identical in shape to step 3a but only
shows the gaps — go back to the dashboard, tick those, save, re-run.

> If a row says `(unmapped — find in dashboard)` instead of a section name,
> Stripe added a permission the script's label table doesn't know about. The
> function name and slug still tell you what to enable; please add the entry
> to `PERMISSION_LABELS` in
> [scripts/stripe/probe-permissions.ts](scripts/stripe/probe-permissions.ts)
> in the same PR so the next person doesn't hit the same gap.

### 4. Get the webhook signing secret

Install `stripe-cli` from <https://stripe.com/docs/stripe-cli> if you haven't
already, then in one shell forward Stripe webhook events to the locally
running API:

```shell
yarn stripe:listen-webhook
```

When the listener starts it prints a signing secret `whsec_...`. Place it in
`.env.local`:

```shell
STRIPE_WEBHOOK_SECRET=whsec_...
```

Your `.env.local` should now contain both:

```shell
STRIPE_SECRET_KEY=rk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Leave `yarn stripe:listen-webhook` running in its terminal whenever you're
working on Stripe-related features — it forwards real Stripe events to your
local API.

## Testing Stripe

Once setup is complete, the day-to-day flow is:

In another shell start the API process

```shell
yarn dev
```

In a third shell trigger individual stripe events on demand

```shell
stripe trigger payment_intent.succeeded --override payment_intent:metadata.campaignId=e8bf74dd-6212-4a0e-b192-56e4eb19e1f2 --override payment_intent:currency=BGN
```

Or replay an already sent event to the test webhook like this

```shell
stripe events resend evt_3MlHGFKApGjVGa9t0GUhYsKB
```

Important - From the the Stripe CLI docs: Triggering some events like payment_intent.succeeded or payment_intent.canceled will also send you a payment_intent.created event for completeness.
