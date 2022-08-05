# Testing

## Testing Stripe

Install `stripe-cli` from <https://stripe.com/docs/stripe-cli>

In one shell forward stripe webhook events to the locally running API

```shell
yarn stripe:listen-webhook
```

:information*source: When you start the listening process you'll be given an signing secret `whsec*....`. Place that secret in `.env.local` as:

```shell
STRIPE_SECRET_KEY=sk_test_.....
STRIPE_WEBHOOK_SECRET=whsec_.....
```

In another shell start the API process

```shell
yarn dev
```

In a third shell trigger individual stripe events on demand

```shell
stripe trigger payment_intent.succeeded --override payment_intent:metadata.campaignId=e8bf74dd-6212-4a0e-b192-56e4eb19e1f2 --override payment_intent:currency=BGN
```
Important - From the the Stripe CLI docs: Triggering some events like payment_intent.succeeded or payment_intent.canceled will also send you a payment_intent.created event for completeness. 
