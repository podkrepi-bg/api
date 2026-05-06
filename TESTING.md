# Testing

## Stripe — first-time setup

You need two things in `.env.local` before the API can talk to Stripe: a
**secret key** (`STRIPE_SECRET_KEY`) and a **webhook signing secret**
(`STRIPE_WEBHOOK_SECRET`). Both are personal to you and easy to obtain.

### 1. Get a personal Stripe test account

If you don't already have one, sign up at <https://dashboard.stripe.com/register>.
You don't need to activate live mode or submit any business details — test
mode works on a fresh account out of the box.

### 2. Get a secret key

> **⚠️ Heads up:** production and staging run on restricted keys
> (`rk_test_...`), not unrestricted secret keys (`sk_test_...`). We recommend
> using a restricted key for local development too, especially when working on
> new Stripe features. This way any missing permission shows up on your machine
> first — rather than surprising everyone after deploy. See
> [Using a restricted key](#using-a-restricted-key-recommended-for-stripe-work)
> below for setup instructions.

1. Open <https://dashboard.stripe.com/test/apikeys>
2. Under **Standard keys**, copy your `sk_test_...` secret key
3. Paste it into `.env.local`:

   ```shell
   STRIPE_SECRET_KEY=sk_test_...
   ```

That's enough to get the API talking to Stripe locally.

### 3. Start the Stripe webhook listener

The easiest way to receive Stripe webhook events locally is via the
`stripe-webhook` Docker service. It runs the Stripe CLI, forwards events to
your locally running API, and **automatically writes the webhook signing
secret** (`STRIPE_WEBHOOK_SECRET`) into `.env.local` on first start — no
manual copy-paste needed.

```shell
docker compose up stripe-webhook -d
```

That's it. Once the container starts you should see `Webhook secret written
to .env.local` in the logs:

```shell
docker compose logs stripe-webhook
```

Your `.env.local` will now contain both keys:

```shell
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...       # auto-populated by the container
```

Leave the container running while you work on Stripe-related features — it
forwards real Stripe events to `http://host.docker.internal:5010`.

> **Alternative (without Docker):** install `stripe-cli` from
> <https://stripe.com/docs/stripe-cli> and run:
>
> ```shell
> yarn stripe:listen-webhook
> ```
>
> Copy the `whsec_...` secret it prints on startup into `.env.local` manually.

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

## Using a restricted key (recommended for Stripe work)

If you're adding or changing Stripe functionality, swap your secret key for a
restricted one so your local environment matches prod:

1. Open <https://dashboard.stripe.com/test/apikeys>
2. Scroll to **Restricted keys** → **Create restricted key**
3. Give it a name like `local-dev-<your-name>`
4. **Leave every permission unchecked for now** — the next step will tell you
   exactly which ones to enable
5. Click **Create key** and copy the `rk_test_...` value
6. Replace the key in `.env.local`:

   ```shell
   STRIPE_SECRET_KEY=rk_test_...
   ```

### Discover which permissions your key needs

You'll do this in two passes — list everything, tick the boxes, then verify.

**1. List every permission the codebase needs:**

```shell
yarn stripe:check-permissions --list-all
```

This prints the full inventory of Stripe permissions the codebase uses,
derived from the `StripeApiClient` gateway in
[apps/api/src/stripe/stripe-api-client.ts](apps/api/src/stripe/stripe-api-client.ts).
**No API key required for this command** — it's a static list of declarations,
safe to run before you've configured anything. The output shows each
dashboard toggle you need to enable, along with the gateway functions that
depend on it.

**2. Tick the boxes in the dashboard.** Open
<https://dashboard.stripe.com/test/apikeys>, edit your restricted key, and
enable the permissions from the output. Save.

**3. Verify your key:**

```shell
yarn stripe:check-permissions
```

This time the script makes real API calls to confirm the key has each scope.
You should see `OK — no missing Stripe permissions detected on this key.` If
anything is missing, the output shows only the gaps — go back to the
dashboard, tick those, save, re-run.

> If a row says `(unmapped — find in dashboard)` instead of a section name,
> Stripe added a permission the script's label table doesn't know about. The
> function name and slug still tell you what to enable; please add the entry
> to `PERMISSION_LABELS` in
> [scripts/stripe/probe-permissions.ts](scripts/stripe/probe-permissions.ts)
> in the same PR so the next person doesn't hit the same gap.
